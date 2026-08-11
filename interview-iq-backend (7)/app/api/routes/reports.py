from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.dependencies import CurrentUser, DbSession, Pagination
from app.services.report_service import ReportService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/reports", tags=["Reports"])


def _report_out(report, breakdown) -> dict:
    return {
        "id": report.id, "session_id": report.session_id, "overall_score": report.overall_score,
        "performance_label": report.performance_label, "communication_score": report.communication_score,
        "technical_score": report.technical_score, "problem_solving_score": report.problem_solving_score,
        "confidence_score": report.confidence_score, "relevance_score": report.relevance_score,
        "structure_score": report.structure_score, "professionalism_score": report.professionalism_score,
        "grammar_score": report.grammar_score,
        "voice_quality_score": report.voice_quality_score,
        "speaking_wpm": report.speaking_wpm, "filler_word_count": report.filler_word_count,
        "long_pause_count": report.long_pause_count, "speech_clarity_score": report.speech_clarity_score,
        "recording_duration_seconds": report.recording_duration_seconds,
        "speaking_speed": report.speaking_speed,
        "average_pause_seconds": report.average_pause_seconds,
        "longest_pause_seconds": report.longest_pause_seconds,
        "voice_confidence_score": report.voice_confidence_score,
        "voice_fluency_score": report.voice_fluency_score,
        "pronunciation_quality_score": report.pronunciation_quality_score,
        "face_visibility_percentage": report.face_visibility_percentage,
        "forward_facing_percentage": report.forward_facing_percentage,
        "recording_stability_note": report.recording_stability_note,
        "eye_contact_percentage": report.eye_contact_percentage,
        "face_detection_percentage": report.face_detection_percentage,
        "head_position_score": report.head_position_score,
        "looking_away_percentage": report.looking_away_percentage,
        "smile_percentage": report.smile_percentage,
        "camera_stability_score": report.camera_stability_score,
        "lighting_quality_score": report.lighting_quality_score,
        "body_language_confidence_score": report.body_language_confidence_score,
        "video_confidence_score": report.video_confidence_score,
        "executive_summary": report.executive_summary, "strengths": report.strengths,
        "growth_areas": report.growth_areas, "interview_tips": report.interview_tips,
        "career_advice": report.career_advice,
        "suggested_learning_resources": report.suggested_learning_resources,
        "improved_answers": report.improved_answers or [],
        "ai_suggestions": report.interview_tips,
        "career_guidance": report.career_advice,
        "body_language_score": report.body_language_confidence_score,
        "eye_contact_score": report.eye_contact_percentage,
        "hiring_recommendation": report.hiring_recommendation,
        "weight_version": report.weight_version,
        "model_disclaimer": report.model_disclaimer, "created_at": report.created_at,
        "visual_metrics": report.visual_metrics,
        "question_breakdown": breakdown,
    }


@router.get("")
def list_reports(db: DbSession, user: CurrentUser, pagination: Pagination):
    items, total = ReportService(db).list_for_user(user, pagination.offset, pagination.page_size)
    page = Page(
        items=[_report_out(r, []) for r in items], page=pagination.page,
        page_size=pagination.page_size, total_items=total,
    )
    return list_response(page)


@router.get("/{report_id}")
def get_report(report_id: int, db: DbSession, user: CurrentUser):
    report, breakdown = ReportService(db).get(user, report_id)
    return success_response(_report_out(report, breakdown))


@router.get("/interviews/{session_id}")
def get_report_by_session(session_id: int, db: DbSession, user: CurrentUser):
    report, breakdown = ReportService(db).get_by_session(user, session_id)
    if not report:
        return success_response(None, "No report found for this session")
    return success_response(_report_out(report, breakdown))


@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: int, db: DbSession, user: CurrentUser):
    path = ReportService(db).generate_pdf(user, report_id)
    return FileResponse(path, filename=f"interview_report_{report_id}.pdf", media_type="application/pdf")


@router.post("/{report_id}/regenerate")
def regenerate_report(report_id: int, db: DbSession, user: CurrentUser):
    report = ReportService(db).regenerate(user, report_id)
    return success_response({"id": report.id, "overall_score": report.overall_score}, "Report regenerated")
