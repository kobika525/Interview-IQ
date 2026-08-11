from fastapi import APIRouter

from app.dependencies import CurrentAdmin, DbSession, Pagination
from app.schemas.admin import AdminPlanIn, AdminPlanUpdate
from app.services.admin_service import AdminService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(tags=["Admin — Subscriptions"])


def _plan_out(plan) -> dict:
    return {
        "id": plan.id, "code": plan.code.value, "name": plan.name,
        "price_monthly": float(plan.price_monthly), "price_yearly": float(plan.price_yearly),
        "resume_scan_limit": plan.resume_scan_limit, "text_interview_limit": plan.text_interview_limit,
        "voice_interview_limit": plan.voice_interview_limit, "video_interview_limit": plan.video_interview_limit,
        "report_history_limit": plan.report_history_limit, "roadmap_access": plan.roadmap_access,
        "premium_resources": plan.premium_resources, "is_active": plan.is_active,
    }


@router.get("/admin/subscriptions")
def list_subscriptions(db: DbSession, admin: CurrentAdmin, pagination: Pagination):
    items, total = AdminService(db).list_subscriptions(pagination.offset, pagination.page_size)
    page = Page(
        items=[{"id": s.id, "user_id": s.user_id, "plan_id": s.plan_id, "status": s.status.value, "billing_cycle": s.billing_cycle} for s in items],
        page=pagination.page, page_size=pagination.page_size, total_items=total,
    )
    return list_response(page)


@router.get("/admin/subscription-plans")
def list_plans(db: DbSession, admin: CurrentAdmin):
    return success_response([_plan_out(p) for p in AdminService(db).list_plans()])


@router.post("/admin/subscription-plans", status_code=201)
def create_plan(payload: AdminPlanIn, db: DbSession, admin: CurrentAdmin):
    plan = AdminService(db).create_plan(payload.model_dump())
    return success_response(_plan_out(plan), "Plan created")


@router.patch("/admin/subscription-plans/{plan_id}")
def update_plan(plan_id: int, payload: AdminPlanUpdate, db: DbSession, admin: CurrentAdmin):
    plan = AdminService(db).update_plan(plan_id, payload.model_dump(exclude_none=True))
    return success_response(_plan_out(plan), "Plan updated")
