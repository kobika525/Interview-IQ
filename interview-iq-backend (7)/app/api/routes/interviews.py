import os
import logging
from pathlib import Path
import tempfile

import aiofiles
from fastapi import APIRouter, File, Form, UploadFile
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.dependencies import CurrentUser, DbSession, Pagination
from app.schemas.interview import (
    InterviewSetupRequest, QuestionOut, SkipQuestionRequest,
    TextAnswerRequest,
)
from app.services.interview_service import InterviewService
from app.core.exceptions import PayloadTooLargeError
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/interviews", tags=["Interviews"])
logger = logging.getLogger("app.interviews.uploads")


async def _stream_upload(file: UploadFile, max_size_mb: int) -> str:
    """Stream an upload to a private temporary file with an early size limit."""
    suffix = Path(file.filename or "upload.bin").suffix
    descriptor, path = tempfile.mkstemp(prefix="interview-iq-", suffix=suffix)
    os.close(descriptor)
    size = 0
    try:
        async with aiofiles.open(path, "wb") as destination:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > max_size_mb * 1024 * 1024:
                    raise PayloadTooLargeError(f"File exceeds the maximum size of {max_size_mb}MB.")
                await destination.write(chunk)
        return path
    except Exception:
        if os.path.exists(path):
            os.remove(path)
        raise


def _enum_value(value):
    """Newly flushed SQLAlchemy rows may still contain their assigned string."""
    return value.value if hasattr(value, "value") else value


def _question_out(sq) -> dict:
    return {
        "id": sq.question.id, "order_number": sq.order_number,
        "question_text": sq.question_snapshot or sq.question.question_text,
        "topic": sq.question.topic, "category": sq.question.category, "difficulty": _enum_value(sq.question.difficulty),
        "interview_type": _enum_value(sq.question.interview_type), "is_skipped": sq.is_skipped, "is_answered": bool(sq.answer),
    }


def _session_out(session) -> dict:
    report = session.report
    return {
        "id": session.id, "mode": _enum_value(session.mode), "interview_type": _enum_value(session.interview_type),
        "difficulty": _enum_value(session.difficulty), "experience_level": _enum_value(session.experience_level),
        "status": _enum_value(session.status), "requested_question_count": session.requested_question_count,
        "created_at": session.created_at, "started_at": session.started_at, "completed_at": session.completed_at,
        "duration_seconds": session.duration_seconds,
        "overall_score": report.overall_score if report else None,
        "report_id": report.id if report else None,
        "has_report": report is not None,
        "visual_presentation_score": (
            (report.visual_metrics or {}).get("visual_presentation_score") if report else None
        ),
        "questions": [_question_out(sq) for sq in sorted(session.session_questions, key=lambda x: x.order_number)],
    }


def _evaluation_out(evaluation) -> dict:
    return {
        "overall_score": evaluation.overall_score,
        "technical_accuracy": evaluation.technical_score,
        "communication": evaluation.communication_score,
        "confidence": evaluation.confidence_score,
        "grammar": evaluation.grammar_score,
        "fluency": evaluation.fluency_score,
        "relevance": evaluation.relevance_score,
        "problem_solving": evaluation.problem_solving_score,
        "strengths": evaluation.strengths,
        "weaknesses": evaluation.weaknesses,
        "improved_answer": evaluation.model_answer,
        "interview_tips": evaluation.interview_tips,
        "career_advice": evaluation.career_advice,
        "suggested_learning_resources": evaluation.suggested_learning_resources,
        "follow_up_question": evaluation.follow_up_question,
        "evaluation_provider": evaluation.evaluation_provider,
        "evaluation_model": evaluation.evaluation_model,
        "relevance_score": evaluation.relevance_score, "technical_score": evaluation.technical_score,
        "communication_score": evaluation.communication_score, "structure_score": evaluation.structure_score,
        "star_score": evaluation.star_score, "keyword_coverage": evaluation.keyword_coverage,
        "matched_keywords": evaluation.matched_keywords, "missing_keywords": evaluation.missing_keywords,
        "feedback": evaluation.feedback, "model_answer": evaluation.model_answer,
        "improvement_suggestion": evaluation.improvement_suggestion,
    }


@router.post("", status_code=201)
def create_session(payload: InterviewSetupRequest, db: DbSession, user: CurrentUser):
    session = InterviewService(db).create_session(user, payload)
    return success_response(_session_out(session), "Interview session created")


@router.get("")
def list_sessions(
    db: DbSession, user: CurrentUser, pagination: Pagination,
    mode: str | None = None, difficulty: str | None = None, status: str | None = None,
):
    items, total = InterviewService(db).list_for_user(
        user, pagination.offset, pagination.page_size, {"mode": mode, "difficulty": difficulty, "status": status}
    )
    page = Page(items=[_session_out(s) for s in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/{session_id}")
def get_session(session_id: int, db: DbSession, user: CurrentUser):
    session = InterviewService(db).get(user, session_id)
    return success_response(_session_out(session))


@router.post("/{session_id}/start")
def start_session(session_id: int, db: DbSession, user: CurrentUser):
    session = InterviewService(db).start(user, session_id)
    return success_response(_session_out(session), "Interview started")


@router.get("/{session_id}/current-question")
def current_question(session_id: int, db: DbSession, user: CurrentUser):
    sq = InterviewService(db).current_question(user, session_id)
    return success_response(_question_out(sq) if sq else None)


@router.get("/{session_id}/questions/{question_order}")
def get_question(session_id: int, question_order: int, db: DbSession, user: CurrentUser):
    sq = InterviewService(db).get_question_by_order(user, session_id, question_order)
    return success_response(_question_out(sq))


@router.post("/{session_id}/answers/text")
def submit_text_answer(session_id: int, payload: TextAnswerRequest, db: DbSession, user: CurrentUser):
    evaluation, next_question, status_value = InterviewService(db).submit_text_answer(user, session_id, payload)
    return success_response(
        {"session_status": status_value, "evaluation": _evaluation_out(evaluation), "next_question": next_question},
        "Answer submitted",
    )


@router.post("/{session_id}/answers/audio")
async def submit_audio_answer(
    session_id: int, db: DbSession, user: CurrentUser, question_order: int,
    transcript: str | None = Form(None), file: UploadFile = File(...),
):
    temporary_path = await _stream_upload(file, settings.MAX_AUDIO_SIZE_MB)
    logger.info(
        "Audio upload received session=%s question=%s bytes=%s",
        session_id, question_order, os.path.getsize(temporary_path),
    )
    try:
        evaluation, next_question, status_value, signals = await run_in_threadpool(
            InterviewService(db).submit_audio_file,
            user, session_id, question_order, file.filename or "answer.webm",
            temporary_path, settings.MAX_AUDIO_SIZE_MB, transcript,
        )
    finally:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)
    return success_response(
        {"session_status": status_value, "evaluation": _evaluation_out(evaluation), "next_question": next_question, "voice_signals": signals},
        "Audio answer processed",
    )


@router.post("/{session_id}/answers/video")
async def submit_video_answer(
    session_id: int, db: DbSession, user: CurrentUser, question_order: int,
    transcript: str | None = Form(None), file: UploadFile = File(...),
):
    temporary_path = await _stream_upload(file, settings.MAX_VIDEO_SIZE_MB)
    logger.info(
        "Video upload received session=%s question=%s bytes=%s",
        session_id, question_order, os.path.getsize(temporary_path),
    )
    try:
        evaluation, next_question, status_value, signals = await run_in_threadpool(
            InterviewService(db).submit_video_file,
            user, session_id, question_order, file.filename or "answer.webm",
            temporary_path, settings.MAX_VIDEO_SIZE_MB, transcript,
        )
    finally:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)
    return success_response(
        {"session_status": status_value, "evaluation": _evaluation_out(evaluation), "next_question": next_question, "video_signals": signals},
        "Video answer processed",
    )


@router.post("/{session_id}/questions/{question_id}/skip")
def skip_question(session_id: int, question_id: int, payload: SkipQuestionRequest, db: DbSession, user: CurrentUser):
    next_question = InterviewService(db).skip_question(user, session_id, payload.question_order)
    return success_response({"next_question": next_question}, "Question skipped")


@router.post("/{session_id}/complete")
def complete_session(session_id: int, db: DbSession, user: CurrentUser):
    report = InterviewService(db).complete(user, session_id)
    return success_response({"report_id": report.id, "overall_score": report.overall_score}, "Interview completed — report generated")


@router.post("/{session_id}/cancel")
def cancel_session(session_id: int, db: DbSession, user: CurrentUser):
    session = InterviewService(db).cancel(user, session_id)
    return success_response(_session_out(session), "Interview cancelled")


@router.get("/{session_id}/status")
def session_status(session_id: int, db: DbSession, user: CurrentUser):
    return success_response(InterviewService(db).status(user, session_id))


@router.get("/{session_id}/report")
def session_report(session_id: int, db: DbSession, user: CurrentUser):
    from app.services.report_service import ReportService

    report, breakdown = ReportService(db).get_by_session(user, session_id)
    if not report:
        return success_response(None, "No report yet for this session")
    return success_response({"report_id": report.id, "overall_score": report.overall_score})


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: DbSession, user: CurrentUser):
    InterviewService(db).delete(user, session_id)
    return None
