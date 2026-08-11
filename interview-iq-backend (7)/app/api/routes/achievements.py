from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession
from app.services.progress_service import ProgressService
from app.utils.responses import success_response

router = APIRouter(prefix="/achievements", tags=["Achievements"])


@router.get("")
def list_achievements(db: DbSession, user: CurrentUser):
    return success_response(ProgressService(db).get_dashboard(user.id)["achievements"])
