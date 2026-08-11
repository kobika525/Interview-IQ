from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession
from app.services.progress_service import ProgressService
from app.utils.responses import success_response

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get("/dashboard")
def dashboard(db: DbSession, user: CurrentUser):
    return success_response(ProgressService(db).get_dashboard(user.id))


@router.get("/summary")
def summary(db: DbSession, user: CurrentUser):
    data = ProgressService(db).get_dashboard(user.id)
    return success_response({k: v for k, v in data.items() if k not in ("score_trend", "weekly_activity", "monthly_activity", "achievements")})


@router.get("/score-trend")
def score_trend(db: DbSession, user: CurrentUser):
    return success_response(ProgressService(db).get_dashboard(user.id)["score_trend"])


@router.get("/weekly-activity")
def weekly_activity(db: DbSession, user: CurrentUser):
    return success_response(ProgressService(db).get_dashboard(user.id)["weekly_activity"])


@router.get("/monthly-activity")
def monthly_activity(db: DbSession, user: CurrentUser):
    return success_response(ProgressService(db).get_dashboard(user.id)["monthly_activity"])


@router.get("/skill-growth")
def skill_growth(db: DbSession, user: CurrentUser):
    data = ProgressService(db).get_dashboard(user.id)
    return success_response({"skill_growth_percentage": data["skill_growth_percentage"]})


@router.get("/mode-distribution")
def mode_distribution(db: DbSession, user: CurrentUser):
    return success_response(ProgressService(db).get_dashboard(user.id)["mode_distribution"])


@router.get("/achievements")
def achievements(db: DbSession, user: CurrentUser):
    return success_response(ProgressService(db).get_dashboard(user.id)["achievements"])


@router.get("/activity")
def activity(db: DbSession, user: CurrentUser):
    data = ProgressService(db).get_dashboard(user.id)
    return success_response(data["weekly_activity"] + data["monthly_activity"])
