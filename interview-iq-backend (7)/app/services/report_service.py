from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError
from app.repositories.interview_repository import InterviewRepository
from app.repositories.report_repository import ReportRepository
from app.services.pdf_service import generate_interview_report_pdf


class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.reports = ReportRepository(db)
        self.interviews = InterviewRepository(db)

    def _question_breakdown(self, session_id: int) -> list[dict]:
        session = self.interviews.get_session(session_id)
        breakdown = []
        for sq in session.session_questions:
            if not sq.answer or not sq.answer.evaluation:
                continue
            ev = sq.answer.evaluation
            breakdown.append({
                "question": sq.question_snapshot or sq.question.question_text,
                "user_answer": sq.answer.answer_text or sq.answer.transcript,
                "score": ev.overall_score,
                "feedback": ev.feedback,
                "keyword_coverage": ev.keyword_coverage,
                "expected_keywords": sq.question.expected_keywords,
                "matched_keywords": ev.matched_keywords,
                "missing_keywords": ev.missing_keywords,
                "model_answer": ev.model_answer,
                "improvement_suggestion": ev.improvement_suggestion,
                "technical_accuracy": ev.technical_score,
                "communication": ev.communication_score,
                "confidence": ev.confidence_score,
                "grammar": ev.grammar_score,
                "fluency": ev.fluency_score,
                "relevance": ev.relevance_score,
                "problem_solving": ev.problem_solving_score,
                "strengths": ev.strengths,
                "weaknesses": ev.weaknesses,
                "improved_answer": ev.model_answer,
                "interview_tips": ev.interview_tips,
                "career_advice": ev.career_advice,
                "suggested_learning_resources": ev.suggested_learning_resources,
                "follow_up_question": ev.follow_up_question,
                "evaluation_provider": ev.evaluation_provider,
                "evaluation_model": ev.evaluation_model,
                "gemini_analysis": ev.gemini_analysis,
                "recording_duration_seconds": sq.answer.recording_duration_seconds,
                "words_per_minute": sq.answer.words_per_minute,
                "speaking_speed": sq.answer.speaking_speed,
                "average_pause_seconds": sq.answer.average_pause_seconds,
                "longest_pause_seconds": sq.answer.longest_pause_seconds,
                "long_pause_count": sq.answer.long_pause_count,
                "filler_word_count": sq.answer.filler_word_count,
                "voice_confidence_score": sq.answer.voice_confidence_score,
                "voice_fluency_score": sq.answer.voice_fluency_score,
                "pronunciation_quality_score": sq.answer.pronunciation_quality_score,
                "voice_clarity_score": sq.answer.voice_clarity_score,
                "transcription_engine": sq.answer.transcription_engine,
                "eye_contact_percentage": sq.answer.eye_contact_percentage,
                "face_detection_percentage": sq.answer.face_detection_percentage,
                "head_position_score": sq.answer.head_position_score,
                "forward_facing_percentage": sq.answer.forward_facing_percentage,
                "looking_away_percentage": sq.answer.looking_away_percentage,
                "smile_percentage": sq.answer.smile_percentage,
                "face_visibility_percentage": sq.answer.face_visibility_percentage,
                "camera_stability_score": sq.answer.camera_stability_score,
                "lighting_quality_score": sq.answer.lighting_quality_score,
                "body_language_confidence_score": sq.answer.body_language_confidence_score,
                "video_confidence_score": sq.answer.video_confidence_score,
                "visual_metrics": sq.answer.visual_metrics,
                "recording_stability_note": sq.answer.recording_stability_note,
            })
        return breakdown

    def _ensure_owned(self, report, user):
        if not report:
            raise NotFoundError("Report not found.")
        session = self.interviews.get_session(report.session_id)
        if session.user_id != user.id and user.role.value != "ADMIN":
            raise ForbiddenError("You don't have access to this report.")
        return report

    def get(self, user, report_id: int) -> dict:
        report = self._ensure_owned(self.reports.get_by_id(report_id), user)
        return report, self._question_breakdown(report.session_id)

    def get_by_session(self, user, session_id: int):
        report = self.reports.get_by_session(session_id)
        return self.get(user, report.id) if report else (None, [])

    def list_for_user(self, user, offset: int, limit: int):
        return self.reports.list_for_user(user.id, offset, limit)

    def generate_pdf(self, user, report_id: int) -> str:
        report, breakdown = self.get(user, report_id)
        report_dict = {
            "id": report.id, "overall_score": report.overall_score, "performance_label": report.performance_label,
            "executive_summary": report.executive_summary, "strengths": report.strengths, "growth_areas": report.growth_areas,
            "communication_score": report.communication_score, "technical_score": report.technical_score,
            "problem_solving_score": report.problem_solving_score, "confidence_score": report.confidence_score,
            "relevance_score": report.relevance_score, "structure_score": report.structure_score,
            "professionalism_score": report.professionalism_score, "model_disclaimer": report.model_disclaimer,
            "grammar_score": report.grammar_score, "voice_quality_score": report.voice_quality_score,
            "interview_tips": report.interview_tips, "career_advice": report.career_advice,
            "suggested_learning_resources": report.suggested_learning_resources,
            "improved_answers": report.improved_answers or [],
            "hiring_recommendation": report.hiring_recommendation,
            "recording_duration_seconds": report.recording_duration_seconds, "speaking_wpm": report.speaking_wpm,
            "speaking_speed": report.speaking_speed, "average_pause_seconds": report.average_pause_seconds,
            "longest_pause_seconds": report.longest_pause_seconds, "long_pause_count": report.long_pause_count,
            "filler_word_count": report.filler_word_count, "voice_confidence_score": report.voice_confidence_score,
            "voice_fluency_score": report.voice_fluency_score,
            "pronunciation_quality_score": report.pronunciation_quality_score,
            "speech_clarity_score": report.speech_clarity_score,
            "eye_contact_percentage": report.eye_contact_percentage,
            "face_detection_percentage": report.face_detection_percentage,
            "head_position_score": report.head_position_score,
            "forward_facing_percentage": report.forward_facing_percentage,
            "looking_away_percentage": report.looking_away_percentage,
            "smile_percentage": report.smile_percentage,
            "face_visibility_percentage": report.face_visibility_percentage,
            "camera_stability_score": report.camera_stability_score,
            "lighting_quality_score": report.lighting_quality_score,
            "body_language_confidence_score": report.body_language_confidence_score,
            "video_confidence_score": report.video_confidence_score,
            "recording_stability_note": report.recording_stability_note,
            "visual_metrics": report.visual_metrics,
        }
        return generate_interview_report_pdf(report_dict, breakdown)

    def regenerate(self, user, report_id: int):
        """Re-runs aggregation from the existing stored answer evaluations
        (does not re-call AI models — those already ran at answer-submission time)."""
        report, breakdown = self.get(user, report_id)
        return report
