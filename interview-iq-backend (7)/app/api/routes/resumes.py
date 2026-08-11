from fastapi import APIRouter, File, Form, UploadFile

from app.config import settings
from app.dependencies import CurrentUser, DbSession, Pagination
from app.schemas.resume import ResumeAnalysisOut, ResumeOut
from app.services.resume_service import ResumeService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/resumes", tags=["Resumes"])


def _resume_out(resume) -> dict:
    return ResumeOut.model_validate(resume).model_dump(mode="json") | {"status": resume.status.value}


@router.post("", status_code=201)
async def upload_resume(
    db: DbSession, user: CurrentUser, file: UploadFile = File(...), target_role_id: int | None = Form(None),
):
    content = await file.read()
    resume = ResumeService(db).upload(user, file.filename, content, target_role_id, settings.MAX_RESUME_SIZE_MB)
    return success_response(_resume_out(resume), "Resume uploaded successfully")


@router.post("/{resume_id}/analyze")
def analyze_resume(resume_id: int, db: DbSession, user: CurrentUser):
    result = ResumeService(db).analyze(user, resume_id)
    return success_response(ResumeAnalysisOut.model_validate(result).model_dump(mode="json"), "Resume analysed successfully")


@router.get("")
def list_resumes(db: DbSession, user: CurrentUser, pagination: Pagination, target_role_id: int | None = None):
    items, total = ResumeService(db).list_for_user(user, pagination.offset, pagination.page_size, target_role_id)
    page = Page(items=[_resume_out(r) for r in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/{resume_id}")
def get_resume(resume_id: int, db: DbSession, user: CurrentUser):
    resume = ResumeService(db).get(user, resume_id)
    return success_response(_resume_out(resume))


@router.get("/{resume_id}/analysis")
def get_analysis(resume_id: int, db: DbSession, user: CurrentUser):
    result = ResumeService(db).get_analysis(user, resume_id)
    return success_response(ResumeAnalysisOut.model_validate(result).model_dump(mode="json"))


@router.post("/{resume_id}/reanalyze")
def reanalyze_resume(resume_id: int, db: DbSession, user: CurrentUser):
    result = ResumeService(db).reanalyze(user, resume_id)
    return success_response(ResumeAnalysisOut.model_validate(result).model_dump(mode="json"), "Resume re-analysed")


@router.get("/{resume_id}/download")
def download_resume(resume_id: int, db: DbSession, user: CurrentUser):
    from fastapi.responses import FileResponse

    from app.services.storage_service import resolve_path

    resume = ResumeService(db).get(user, resume_id)
    return FileResponse(resolve_path(resume.file_path), filename=resume.original_filename, media_type=resume.mime_type)


@router.get("/{resume_id}/report")
def get_resume_report(resume_id: int, db: DbSession, user: CurrentUser):
    from app.services.pdf_service import generate_resume_report_pdf

    service = ResumeService(db)
    resume = service.get(user, resume_id)
    analysis = service.get_analysis(user, resume_id)
    path = generate_resume_report_pdf(resume.original_filename, analysis)
    return success_response({"pdf_path": path}, "Report generated")


@router.delete("/{resume_id}", status_code=204)
def delete_resume(resume_id: int, db: DbSession, user: CurrentUser):
    ResumeService(db).delete(user, resume_id)
    return None
