from fastapi import APIRouter

from app.core.exceptions import ForbiddenError, NotFoundError
from app.dependencies import CurrentUser, DbSession
from app.models.job import ProcessingJob
from app.utils.responses import success_response

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("/{job_id}")
def get_job(job_id: int, db: DbSession, user: CurrentUser):
    job = db.get(ProcessingJob, job_id)
    if not job:
        raise NotFoundError("Job not found.")
    if job.user_id != user.id and user.role.value != "ADMIN":
        raise ForbiddenError("You don't have access to this job.")
    return success_response({
        "job_id": job.id, "status": job.status.value, "progress": job.progress,
        "current_stage": job.current_stage, "error_message": job.error_message,
    })


@router.post("/{job_id}/retry")
def retry_job(job_id: int, db: DbSession, user: CurrentUser):
    job = db.get(ProcessingJob, job_id)
    if not job:
        raise NotFoundError("Job not found.")
    if job.user_id != user.id and user.role.value != "ADMIN":
        raise ForbiddenError("You don't have access to this job.")
    job.status = "PENDING"
    job.progress = 0
    job.error_message = None
    db.commit()
    return success_response({"job_id": job.id, "status": job.status.value}, "Job queued for retry")
