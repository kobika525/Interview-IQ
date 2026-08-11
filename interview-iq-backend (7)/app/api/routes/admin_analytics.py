from fastapi import APIRouter

from app.dependencies import CurrentAdmin, DbSession
from app.services.admin_service import AdminService
from app.utils.responses import success_response

router = APIRouter(prefix="/admin", tags=["Admin — Analytics"])


@router.get("/dashboard")
def admin_dashboard(db: DbSession, admin: CurrentAdmin):
    return success_response(AdminService(db).dashboard())


@router.get("/analytics/users")
def analytics_users(db: DbSession, admin: CurrentAdmin, start_date: str | None = None, end_date: str | None = None):
    return success_response(AdminService(db).analytics_users(start_date, end_date))


@router.get("/analytics/interviews")
def analytics_interviews(db: DbSession, admin: CurrentAdmin):
    dashboard = AdminService(db).dashboard()
    return success_response({
        "completed_interviews": dashboard["completed_interviews"],
        "mode_distribution": dashboard["interview_mode_distribution"],
        "average_score": dashboard["average_interview_score"],
    })


@router.get("/analytics/resumes")
def analytics_resumes(db: DbSession, admin: CurrentAdmin):
    dashboard = AdminService(db).dashboard()
    return success_response({"resume_analyses": dashboard["resume_analyses"]})


@router.get("/analytics/subscriptions")
def analytics_subscriptions(db: DbSession, admin: CurrentAdmin):
    dashboard = AdminService(db).dashboard()
    return success_response({"active_subscriptions": dashboard["active_subscriptions"]})


@router.get("/analytics/resources")
def analytics_resources(db: DbSession, admin: CurrentAdmin):
    items, total = AdminService(db).list_resources_admin(0, 500)
    return success_response({"total_resources": total})
