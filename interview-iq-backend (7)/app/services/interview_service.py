import os
import logging

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.ai.interview.question_selector import missing_question_count, order_questions
from app.ai.interview.text_evaluator import evaluate_answer
from app.ai.llm.fallback_generator import generate_question_with_fallback
from app.ai.speech.audio_analyzer import analyze_recording
from app.ai.speech.speech_to_text import transcribe_audio
from app.ai.video.audio_extractor import extract_audio_track
from app.ai.video.video_signal_analyzer import analyze_video_signals
from app.core.exceptions import AIServiceError, ForbiddenError, NotFoundError, ValidationAppError
from app.core.permissions import enforce_usage_limit, increment_usage, require_plan_feature
from app.models.interview import InterviewSession
from app.models.user import User
from app.repositories.career_repository import CareerRepository
from app.repositories.interview_repository import InterviewRepository
from app.repositories.report_repository import ReportRepository
from app.services.notification_service import NotificationService
from app.services.storage_service import delete_file, resolve_path, save_bytes, save_file
from app.utils.enums import InterviewStatus, NotificationType
from app.utils.file_validation import (
    validate_audio_path, validate_audio_upload, validate_video_path, validate_video_upload,
)
from app.config import settings

MODE_USAGE_KEY = {"TEXT": "text_interview", "VOICE": "voice_interview", "VIDEO": "video_interview"}
logger = logging.getLogger("app.interviews")


class InterviewService:
    def __init__(
        self, db: Session, *, evaluator=None, transcriber=None,
        audio_analyzer=None, video_analyzer=None, audio_extractor=None,
    ):
        self.db = db
        self.interviews = InterviewRepository(db)
        self.careers = CareerRepository(db)
        self.reports = ReportRepository(db)
        self.notifications = NotificationService(db)
        self.evaluate_answer = evaluator or evaluate_answer
        self.transcribe_audio = transcriber or transcribe_audio
        self.analyze_recording = audio_analyzer or analyze_recording
        self.analyze_video_signals = video_analyzer or analyze_video_signals
        self.extract_audio_track = audio_extractor or extract_audio_track

    # --- Setup ---
    def create_session(self, user: User, data) -> InterviewSession:
        if data.mode == "VIDEO":
            require_plan_feature(self.db, user.id, "video_interview")
        enforce_usage_limit(self.db, user.id, MODE_USAGE_KEY[data.mode])

        session = self.interviews.create_session(
            user_id=user.id, career_role_id=data.target_role_id, resume_id=data.resume_id,
            mode=data.mode, interview_type=data.interview_type, experience_level=data.experience_level,
            difficulty=data.difficulty, requested_question_count=data.question_count,
            question_categories=data.question_categories, job_description=data.job_description,
            preferred_language=data.preferred_language, status=InterviewStatus.CREATED,
        )

        role_title = "software engineering"
        if data.target_role_id:
            role = self.careers.get_role(data.target_role_id)
            role_title = role.title if role else role_title

        available = self.interviews.find_questions(
            career_role_id=data.target_role_id, difficulty=data.difficulty,
            interview_type=data.interview_type, categories=data.question_categories or None,
            limit=data.question_count,
        )
        chosen = order_questions(available, data.question_count)

        missing = missing_question_count(len(chosen), data.question_count)
        topics = data.question_categories or [role_title]
        for i in range(missing):
            generated = generate_question_with_fallback(
                topics[i % len(topics)], data.interview_type, data.difficulty, role_title,
            )
            question = self.interviews.create_question(
                question_text=generated["question_text"], career_role_id=data.target_role_id,
                topic=generated["topic"], category=generated["category"], difficulty=generated["difficulty"],
                interview_type=generated["interview_type"], expected_keywords=generated["expected_keywords"],
                expected_key_points=generated["expected_key_points"], sample_answer=generated["sample_answer"],
                source=generated["source"],
            )
            chosen.append(question)

        for order_number, question in enumerate(chosen, start=1):
            self.interviews.add_session_question(
                session_id=session.id,
                question_id=question.id,
                question_snapshot=question.question_text,
                order_number=order_number,
            )

        increment_usage(self.db, user.id, MODE_USAGE_KEY[data.mode])
        self.db.commit()
        return self.interviews.get_session(session.id)

    def _ensure_owned(self, session: InterviewSession | None, user: User) -> InterviewSession:
        if not session:
            raise NotFoundError("Interview session not found.")
        if session.user_id != user.id:
            raise ForbiddenError("You don't have access to this interview session.")
        return session

    def get(self, user: User, session_id: int) -> InterviewSession:
        return self._ensure_owned(self.interviews.get_session(session_id), user)

    def start(self, user: User, session_id: int) -> InterviewSession:
        session = self.get(user, session_id)
        if session.status not in (InterviewStatus.CREATED, InterviewStatus.READY):
            raise ValidationAppError(f"Cannot start a session in status {session.status.value}.")
        session.status = InterviewStatus.IN_PROGRESS
        from app.utils.datetime import utcnow
        session.started_at = utcnow()
        self.db.commit()
        return session

    def current_question(self, user: User, session_id: int):
        session = self.get(user, session_id)
        for sq in session.session_questions:
            if not sq.answer and not sq.is_skipped:
                return sq
        return None

    def get_question_by_order(self, user: User, session_id: int, order_number: int):
        session = self.get(user, session_id)
        sq = self.interviews.get_session_question(session_id, order_number)
        if not sq:
            raise NotFoundError("Question not found for this session.")
        return sq

    def _next_question_payload(self, session: InterviewSession):
        nxt = self.current_question_obj(session)
        if not nxt:
            return None
        return {
            "id": nxt.question.id, "order_number": nxt.order_number,
            "question_text": nxt.question_snapshot or nxt.question.question_text,
            "topic": nxt.question.topic, "category": nxt.question.category, "difficulty": nxt.question.difficulty.value,
            "interview_type": nxt.question.interview_type.value, "is_skipped": nxt.is_skipped, "is_answered": bool(nxt.answer),
        }

    def current_question_obj(self, session: InterviewSession):
        for sq in session.session_questions:
            if not sq.answer and not sq.is_skipped:
                return sq
        return None

    # --- Answers ---
    def _submission_question(self, session_id: int, question_order: int):
        sq = self.interviews.get_session_question(session_id, question_order, for_update=True)
        if not sq:
            raise NotFoundError("Question not found for this session.")
        if sq.answer:
            raise ValidationAppError("This question has already been answered.")
        return sq

    def _create_evaluation(self, answer_id: int, result: dict):
        """Persist both the new Gemini payload and legacy compatibility fields."""
        return self.interviews.create_evaluation(
            answer_id=answer_id,
            relevance_score=result["relevance_score"], technical_score=result["technical_score"],
            communication_score=result["communication_score"], structure_score=result["structure_score"],
            star_score=result["star_score"], keyword_coverage=result["keyword_coverage"],
            matched_keywords=result["matched_keywords"], missing_keywords=result["missing_keywords"],
            feedback=result["feedback"], model_answer=result["model_answer"],
            improvement_suggestion=result["improvement_suggestion"],
            overall_score=result["overall_answer_score"], confidence_score=result["confidence_score"],
            grammar_score=result["grammar"], fluency_score=result["fluency"],
            problem_solving_score=result["problem_solving"], strengths=result["strengths"],
            weaknesses=result["weaknesses"], interview_tips=result["interview_tips"],
            career_advice=result["career_advice"],
            suggested_learning_resources=result["suggested_learning_resources"],
            follow_up_question=result["follow_up_question"], evaluation_provider="gemini",
            evaluation_model=settings.GEMINI_MODEL,
            gemini_analysis={
                **result,
                "evaluation_provider": "gemini",
                "evaluation_model": settings.GEMINI_MODEL,
            },
            weight_version="gemini-v1",
        )

    def submit_text_answer(self, user: User, session_id: int, data):
        try:
            session = self.get(user, session_id)
            if session.status != InterviewStatus.IN_PROGRESS:
                raise ValidationAppError("Session is not in progress.")
            sq = self._submission_question(session_id, data.question_order)
            answer = self.interviews.create_answer(
                session_question_id=sq.id, answer_text=data.answer_text,
                word_count=len(data.answer_text.split()), char_count=len(data.answer_text),
            )
            evaluation_result = self.evaluate_answer(
                answer_text=data.answer_text, question_text=sq.question_snapshot or sq.question.question_text,
                expected_keywords=sq.question.expected_keywords, interview_type=sq.question.interview_type.value,
                sample_answer=sq.question.sample_answer,
            )
            evaluation = self._create_evaluation(answer.id, evaluation_result)
            self.db.commit()
            self.db.expire_all()
            session = self.interviews.get_session(session_id)
            logger.info("Gemini text evaluation saved session=%s question=%s", session_id, data.question_order)
            return evaluation, self._next_question_payload(session), session.status.value
        except IntegrityError as exc:
            self.db.rollback()
            logger.warning("Duplicate text submission blocked session=%s question=%s", session_id, data.question_order)
            raise ValidationAppError("This question has already been answered.") from exc
        except Exception:
            self.db.rollback()
            logger.exception("Text answer submission failed session=%s question=%s", session_id, data.question_order)
            raise

    def submit_audio_answer(
        self, user: User, session_id: int, question_order: int, filename: str,
        content: bytes, max_size_mb: int, transcript_override: str | None = None,
    ):
        validate_audio_upload(filename, content, max_size_mb)
        stored = save_bytes(content, filename, "audio")
        return self._process_audio(user, session_id, question_order, stored, transcript_override)

    def submit_audio_file(
        self, user: User, session_id: int, question_order: int, filename: str,
        source_path: str, max_size_mb: int, transcript_override: str | None = None,
    ):
        validate_audio_path(filename, source_path, max_size_mb)
        stored = save_file(source_path, filename, "audio")
        return self._process_audio(user, session_id, question_order, stored, transcript_override)

    def _process_audio(self, user: User, session_id: int, question_order: int, stored: dict, transcript_override=None):
        try:
            session = self.get(user, session_id)
            if session.status != InterviewStatus.IN_PROGRESS:
                raise ValidationAppError("Session is not in progress.")
            sq = self._submission_question(session_id, question_order)

            # Browser speech recognition is preview-only and never persisted or evaluated.
            del transcript_override
            absolute_path = resolve_path(stored["storage_key"])
            transcription = self.transcribe_audio(absolute_path)
            transcript = transcription.get("transcript") or ""
            if not transcription["available"] or not transcript.strip():
                raise ValidationAppError(
                    transcription.get("message")
                    or "Couldn't transcribe this audio. Please try again or submit a text answer instead."
                )

            signals = self.analyze_recording(absolute_path, transcript, transcription)
            answer = self.interviews.create_answer(
                session_question_id=sq.id, audio_path=stored["storage_key"], transcript=transcript,
                word_count=signals["word_count"], char_count=len(transcript),
                recording_duration_seconds=signals["recording_duration"], words_per_minute=signals["words_per_minute"],
                speaking_speed=signals["speaking_speed"], average_pause_seconds=signals["average_pause"],
                longest_pause_seconds=signals["longest_pause"], long_pause_count=signals["long_pause_count"],
                filler_word_count=signals["filler_word_count"], voice_confidence_score=signals["confidence_level"],
                voice_fluency_score=signals["fluency"], pronunciation_quality_score=signals["pronunciation_quality"],
                voice_clarity_score=signals["voice_clarity"], transcription_engine=signals["transcription_engine"],
            )
            evaluation_result = self.evaluate_answer(
                answer_text=transcript, question_text=sq.question_snapshot or sq.question.question_text,
                expected_keywords=sq.question.expected_keywords, interview_type=sq.question.interview_type.value,
                sample_answer=sq.question.sample_answer,
            )
            evaluation = self._create_evaluation(answer.id, evaluation_result)
            self.db.commit()
            self.db.expire_all()
            session = self.interviews.get_session(session_id)
            logger.info("Gemini audio evaluation saved session=%s question=%s", session_id, question_order)
            return evaluation, self._next_question_payload(session), session.status.value, signals
        except IntegrityError as exc:
            self.db.rollback()
            delete_file(stored["storage_key"])
            logger.warning("Duplicate audio submission blocked session=%s question=%s", session_id, question_order)
            raise ValidationAppError("This question has already been answered.") from exc
        except Exception:
            self.db.rollback()
            delete_file(stored["storage_key"])
            logger.exception("Audio answer submission failed session=%s question=%s", session_id, question_order)
            raise

    def submit_video_answer(
        self, user: User, session_id: int, question_order: int, filename: str,
        content: bytes, max_size_mb: int, transcript_override: str | None = None,
    ):
        validate_video_upload(filename, content, max_size_mb)
        stored = save_bytes(content, filename, "video")
        return self._process_video(user, session_id, question_order, stored, transcript_override)

    def submit_video_file(
        self, user: User, session_id: int, question_order: int, filename: str,
        source_path: str, max_size_mb: int, transcript_override: str | None = None,
    ):
        validate_video_path(filename, source_path, max_size_mb)
        stored = save_file(source_path, filename, "video")
        return self._process_video(user, session_id, question_order, stored, transcript_override)

    def _process_video(self, user: User, session_id: int, question_order: int, stored: dict, transcript_override=None):
        extracted_audio_path = None
        try:
            session = self.get(user, session_id)
            if session.status != InterviewStatus.IN_PROGRESS:
                raise ValidationAppError("Session is not in progress.")
            sq = self._submission_question(session_id, question_order)
            absolute_path = resolve_path(stored["storage_key"])
            # Browser speech recognition is preview-only. Every official video
            # transcript comes from Gemini processing the extracted audio track.
            del transcript_override
            try:
                extracted_audio_path = self.extract_audio_track(absolute_path)
            except RuntimeError as exc:
                raise ValidationAppError(
                    "Couldn't extract an audio track from this video. Please record it again with microphone access."
                ) from exc
            transcription = self.transcribe_audio(extracted_audio_path)
            transcript = transcription.get("transcript") or ""

            if not transcription.get("available") or not transcript.strip():
                raise AIServiceError(
                    transcription.get("message")
                    or "Gemini couldn't transcribe the extracted video audio. Please try again."
                )
            video_signals = self.analyze_video_signals(absolute_path)
            voice_signals = self.analyze_recording(extracted_audio_path, transcript, transcription)
            answer = self.interviews.create_answer(
                session_question_id=sq.id, video_path=stored["storage_key"], transcript=transcript,
                word_count=len(transcript.split()), char_count=len(transcript),
                recording_duration_seconds=voice_signals["recording_duration"],
                words_per_minute=voice_signals["words_per_minute"],
                speaking_speed=voice_signals["speaking_speed"],
                average_pause_seconds=voice_signals["average_pause"],
                longest_pause_seconds=voice_signals["longest_pause"],
                long_pause_count=voice_signals["long_pause_count"],
                filler_word_count=voice_signals["filler_word_count"],
                voice_confidence_score=voice_signals["confidence_level"],
                voice_fluency_score=voice_signals["fluency"],
                pronunciation_quality_score=voice_signals["pronunciation_quality"],
                voice_clarity_score=voice_signals["voice_clarity"],
                transcription_engine=voice_signals["transcription_engine"],
                eye_contact_percentage=video_signals["eye_contact_percentage"],
                face_detection_percentage=video_signals["face_detection_percentage"],
                head_position_score=video_signals["head_position_score"],
                forward_facing_percentage=video_signals["forward_facing_percentage"],
                looking_away_percentage=video_signals["looking_away_percentage"],
                smile_percentage=video_signals["smile_percentage"],
                face_visibility_percentage=video_signals["face_visibility_percentage"],
                camera_stability_score=video_signals["camera_stability_score"],
                lighting_quality_score=video_signals["lighting_quality_score"],
                body_language_confidence_score=video_signals["body_language_confidence_score"],
                video_confidence_score=video_signals["video_confidence_score"],
                visual_metrics=video_signals,
                recording_stability_note=video_signals["stability_note"],
            )
            evaluation_result = self.evaluate_answer(
                answer_text=transcript, question_text=sq.question_snapshot or sq.question.question_text,
                expected_keywords=sq.question.expected_keywords, interview_type=sq.question.interview_type.value,
                sample_answer=sq.question.sample_answer,
            )
            evaluation = self._create_evaluation(answer.id, evaluation_result)
            self.db.commit()
            self.db.expire_all()
            session = self.interviews.get_session(session_id)
            logger.info("Gemini video evaluation saved session=%s question=%s", session_id, question_order)
            return (
                evaluation,
                self._next_question_payload(session),
                session.status.value,
                {**video_signals, "voice_signals": voice_signals},
            )
        except IntegrityError as exc:
            self.db.rollback()
            delete_file(stored["storage_key"])
            logger.warning("Duplicate video submission blocked session=%s question=%s", session_id, question_order)
            raise ValidationAppError("This question has already been answered.") from exc
        except Exception:
            self.db.rollback()
            delete_file(stored["storage_key"])
            logger.exception("Video answer submission failed session=%s question=%s", session_id, question_order)
            raise
        finally:
            if extracted_audio_path and os.path.exists(extracted_audio_path):
                os.remove(extracted_audio_path)

    def skip_question(self, user: User, session_id: int, question_order: int):
        session = self.get(user, session_id)
        sq = self.interviews.get_session_question(session_id, question_order)
        if not sq:
            raise NotFoundError("Question not found for this session.")
        sq.is_skipped = True
        self.db.commit()
        self.db.expire_all()
        session = self.interviews.get_session(session_id)
        return self._next_question_payload(session)

    def status(self, user: User, session_id: int):
        session = self.get(user, session_id)
        answered = len([sq for sq in session.session_questions if sq.answer])
        return {
            "session_id": session.id, "status": session.status.value,
            "answered_count": answered, "total_count": len(session.session_questions),
        }

    def cancel(self, user: User, session_id: int):
        session = self.get(user, session_id)
        session.status = InterviewStatus.CANCELLED
        self.db.commit()
        return session

    def complete(self, user: User, session_id: int):
        from app.ai.interview.report_generator import aggregate_report
        from app.utils.datetime import strip_tz, utcnow

        session = self.get(user, session_id)
        if session.status not in (InterviewStatus.IN_PROGRESS,):
            raise ValidationAppError(f"Cannot complete a session in status {session.status.value}.")

        answered_questions = [sq for sq in session.session_questions if sq.answer and sq.answer.evaluation]
        if not answered_questions:
            raise ValidationAppError("Cannot complete an interview with no answered questions.")

        evaluations_for_report = []
        for sq in answered_questions:
            ev = sq.answer.evaluation
            required_scores = (
                ev.overall_score, ev.communication_score, ev.technical_score,
                ev.confidence_score, ev.grammar_score, ev.relevance_score,
                ev.problem_solving_score,
            )
            if ev.evaluation_provider != "gemini" or ev.gemini_analysis is None or any(
                score is None for score in required_scores
            ):
                logger.error(
                    "Report completion rejected non-Gemini evaluation session=%s answer=%s provider=%s",
                    session_id, ev.answer_id, ev.evaluation_provider,
                )
                raise ValidationAppError(
                    "Every answer must have a valid Gemini evaluation before the interview can be completed."
                )
            evaluations_for_report.append({
                "overall_answer_score": ev.overall_score, "communication_score": ev.communication_score,
                "technical_score": ev.technical_score, "structure_score": ev.structure_score,
                "confidence_score": ev.confidence_score,
                "professionalism_score": ev.grammar_score,
                "grammar_score": ev.grammar_score,
                "relevance_score": ev.relevance_score,
                "problem_solving_score": ev.problem_solving_score,
                "strengths": ev.strengths, "weaknesses": ev.weaknesses,
                "interview_tips": ev.interview_tips, "career_advice": ev.career_advice,
                "suggested_learning_resources": ev.suggested_learning_resources,
                "improved_answer": ev.model_answer,
            })

        voice_answers = [
            sq.answer for sq in answered_questions
            if sq.answer.audio_path or (sq.answer.video_path and sq.answer.recording_duration_seconds is not None)
        ]
        voice_signals = self._aggregate_voice_signals(voice_answers) if voice_answers else None
        video_answers = [sq.answer for sq in answered_questions if sq.answer.video_path]
        video_signals = self._aggregate_video_signals(video_answers) if video_answers else {}
        report_data = aggregate_report(
            evaluations_for_report,
            voice_signals=voice_signals,
            video_signals=video_signals or None,
        )
        report = self.reports.create(
            session_id=session.id, overall_score=report_data["overall_score"],
            performance_label=report_data["performance_label"], communication_score=report_data["communication_score"],
            technical_score=report_data["technical_score"], problem_solving_score=report_data["problem_solving_score"],
            confidence_score=report_data["confidence_score"], relevance_score=report_data["relevance_score"],
            structure_score=report_data["structure_score"], professionalism_score=report_data["professionalism_score"],
            grammar_score=report_data["grammar_score"],
            voice_quality_score=report_data.get("voice_quality_score"),
            executive_summary=report_data["executive_summary"], strengths=report_data["strengths"],
            growth_areas=report_data["growth_areas"], interview_tips=report_data["interview_tips"],
            career_advice=report_data["career_advice"],
            suggested_learning_resources=report_data["suggested_learning_resources"],
            improved_answers=report_data["improved_answers"],
            hiring_recommendation=report_data["hiring_recommendation"],
            recommended_resource_ids=[], recommended_roadmap_item_ids=[],
            speaking_wpm=report_data.get("speaking_wpm"), filler_word_count=report_data.get("filler_word_count"),
            long_pause_count=report_data.get("long_pause_count"), speech_clarity_score=report_data.get("speech_clarity_score"),
            recording_duration_seconds=report_data.get("recording_duration_seconds"),
            speaking_speed=report_data.get("speaking_speed"), average_pause_seconds=report_data.get("average_pause_seconds"),
            longest_pause_seconds=report_data.get("longest_pause_seconds"),
            voice_confidence_score=report_data.get("voice_confidence_score"),
            voice_fluency_score=report_data.get("voice_fluency_score"),
            pronunciation_quality_score=report_data.get("pronunciation_quality_score"),
            face_visibility_percentage=video_signals.get("face_visibility_percentage"),
            forward_facing_percentage=video_signals.get("forward_facing_percentage"),
            recording_stability_note=video_signals.get("recording_stability_note"),
            eye_contact_percentage=video_signals.get("eye_contact_percentage"),
            face_detection_percentage=video_signals.get("face_detection_percentage"),
            head_position_score=video_signals.get("head_position_score"),
            looking_away_percentage=video_signals.get("looking_away_percentage"),
            smile_percentage=video_signals.get("smile_percentage"),
            camera_stability_score=video_signals.get("camera_stability_score"),
            lighting_quality_score=video_signals.get("lighting_quality_score"),
            body_language_confidence_score=video_signals.get("body_language_confidence_score"),
            video_confidence_score=video_signals.get("video_confidence_score"),
            visual_metrics=video_signals or None,
        )

        session.status = InterviewStatus.COMPLETED
        session.completed_at = utcnow()
        if session.started_at:
            session.duration_seconds = int(
                (strip_tz(session.completed_at) - strip_tz(session.started_at)).total_seconds()
            )

        self.notifications.create(
            user_id=user.id, type=NotificationType.INTERVIEW, title="Interview report ready",
            message=f"Your {session.mode.value.lower()} interview scored {report_data['overall_score']}/100.",
            link=f"/app/interviews/report/{report.id}",
        )
        self.db.commit()
        logger.info(
            "Gemini-only interview report saved session=%s report=%s answers=%s",
            session_id, report.id, len(answered_questions),
        )
        return report

    @staticmethod
    def _aggregate_voice_signals(answers: list) -> dict:
        def average(attribute: str):
            values = [getattr(answer, attribute) for answer in answers if getattr(answer, attribute) is not None]
            return round(sum(values) / len(values), 1) if values else None

        wpm = average("words_per_minute")
        speeds = [answer.speaking_speed for answer in answers if answer.speaking_speed]
        return {
            "recording_duration": round(sum(answer.recording_duration_seconds or 0 for answer in answers), 1),
            "words_per_minute": wpm,
            "speaking_speed": max(set(speeds), key=speeds.count) if speeds else None,
            "average_pause": average("average_pause_seconds"),
            "longest_pause": max((answer.longest_pause_seconds or 0 for answer in answers), default=None),
            "long_pause_count": sum(answer.long_pause_count or 0 for answer in answers),
            "filler_word_count": sum(answer.filler_word_count or 0 for answer in answers),
            "confidence_level": average("voice_confidence_score"),
            "fluency": average("voice_fluency_score"),
            "pronunciation_quality": average("pronunciation_quality_score"),
            "voice_clarity": average("voice_clarity_score"),
        }

    @staticmethod
    def _aggregate_video_signals(answers: list) -> dict:
        def average(attribute: str):
            values = [getattr(answer, attribute) for answer in answers if getattr(answer, attribute) is not None]
            return round(sum(values) / len(values), 1) if values else None

        notes = [answer.recording_stability_note for answer in answers if answer.recording_stability_note]
        result = {
            "eye_contact_percentage": average("eye_contact_percentage"),
            "face_detection_percentage": average("face_detection_percentage"),
            "head_position_score": average("head_position_score"),
            "forward_facing_percentage": average("forward_facing_percentage"),
            "looking_away_percentage": average("looking_away_percentage"),
            "smile_percentage": average("smile_percentage"),
            "face_visibility_percentage": average("face_visibility_percentage"),
            "camera_stability_score": average("camera_stability_score"),
            "lighting_quality_score": average("lighting_quality_score"),
            "body_language_confidence_score": average("body_language_confidence_score"),
            "video_confidence_score": average("video_confidence_score"),
            "recording_stability_note": max(set(notes), key=notes.count) if notes else None,
        }
        visual_payloads = [answer.visual_metrics for answer in answers if answer.visual_metrics]
        if visual_payloads:
            # Retain full raw evidence. Report-level summary uses averages only for
            # numeric values and preserves warnings/guidance from every answer.
            numeric_keys = (
                "face_presence_percentage", "eye_contact_percentage", "head_stability_score",
                "multiple_face_percentage", "average_brightness", "dark_frame_percentage",
                "overexposed_frame_percentage", "camera_framing_score", "visual_presentation_score",
                "processing_time_ms",
            )
            for key in numeric_keys:
                values = [payload.get(key) for payload in visual_payloads if payload.get(key) is not None]
                result[key] = round(sum(values) / len(values), 1) if values else None
            result.update({
                "analyzed_frame_count": sum(payload.get("analyzed_frame_count", 0) for payload in visual_payloads),
                "face_frames": sum(payload.get("face_frames", 0) for payload in visual_payloads),
                "valid_eye_contact_frames": sum(payload.get("valid_eye_contact_frames", 0) for payload in visual_payloads),
                "excessive_movement_count": sum(payload.get("excessive_movement_count", 0) for payload in visual_payloads),
                "multiple_face_frame_count": sum(payload.get("multiple_face_frame_count", 0) for payload in visual_payloads),
                "multiple_face_warning": any(payload.get("multiple_face_warning", False) for payload in visual_payloads),
                "camera_framing_guidance": list(dict.fromkeys(
                    item for payload in visual_payloads for item in payload.get("camera_framing_guidance", [])
                )),
                "lighting_recommendation": next((
                    payload.get("lighting_recommendation") for payload in visual_payloads
                    if payload.get("lighting_status") not in (None, "acceptable", "unavailable")
                ), visual_payloads[0].get("lighting_recommendation")),
                "visual_presentation_components": list(dict.fromkeys(
                    item for payload in visual_payloads for item in payload.get("visual_presentation_components", [])
                )),
                "visual_presentation_disclaimer": visual_payloads[0].get("visual_presentation_disclaimer"),
                "visual_metric_answers": visual_payloads,
            })
            for metric in ("face_presence", "eye_contact", "head_stability", "camera_framing", "visual_presentation"):
                value = result.get(f"{metric}_percentage", result.get(f"{metric}_score"))
                result[f"{metric}_status"] = "unavailable" if value is None else "good" if value >= 75 else "fair" if value >= 50 else "needs_improvement"
            dark = result.get("dark_frame_percentage")
            bright = result.get("overexposed_frame_percentage")
            result["lighting_status"] = "unavailable" if dark is None else "too_dark" if dark >= 30 else "overexposed" if bright >= 30 else "acceptable"
        return result

    def list_for_user(self, user: User, offset: int, limit: int, filters: dict):
        return self.interviews.list_sessions_for_user(user.id, offset, limit, filters)

    def delete(self, user: User, session_id: int) -> None:
        session = self.get(user, session_id)
        self.interviews.delete_session(session)
        self.db.commit()
