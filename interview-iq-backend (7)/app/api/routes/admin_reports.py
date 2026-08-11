from fastapi import APIRouter

from app.dependencies import CurrentAdmin, DbSession, Pagination
from app.services.admin_service import AdminService
from app.services.support_service import SupportService
from app.utils.pagination import Page
from app.utils.responses import list_response

router = APIRouter(tags=["Admin — Reports"])


@router.get("/admin/reports/interviews")
def interview_reports(db: DbSession, admin: CurrentAdmin, pagination: Pagination):
    items, total = AdminService(db).interview_reports(pagination.offset, pagination.page_size)
    page = Page(
        items=[{"id": r.id, "session_id": r.session_id, "overall_score": r.overall_score, "created_at": r.created_at} for r in items],
        page=pagination.page, page_size=pagination.page_size, total_items=total,
    )
    return list_response(page)


@router.get("/admin/reports/resumes")
def resume_reports(db: DbSession, admin: CurrentAdmin, pagination: Pagination):
    items, total = AdminService(db).resume_reports(pagination.offset, pagination.page_size)
    page = Page(
        items=[{"id": r.id, "user_id": r.user_id, "original_filename": r.original_filename, "status": r.status.value, "created_at": r.created_at} for r in items],
        page=pagination.page, page_size=pagination.page_size, total_items=total,
    )
    return list_response(page)


@router.get("/admin/support/tickets")
def support_tickets(db: DbSession, admin: CurrentAdmin, pagination: Pagination, status: str | None = None):
    items, total = SupportService(db).list_all_admin(pagination.offset, pagination.page_size, status)
    page = Page(
        items=[{"id": t.id, "user_id": t.user_id, "subject": t.subject, "status": t.status.value, "category": t.category.value} for t in items],
        page=pagination.page, page_size=pagination.page_size, total_items=total,
    )
    return list_response(page)


@router.patch("/admin/support/tickets/{ticket_id}")
def update_ticket(ticket_id: int, payload: dict, db: DbSession, admin: CurrentAdmin):
    from app.utils.responses import success_response

    ticket = SupportService(db).close(admin.id, ticket_id, is_admin=True) if payload.get("status") == "CLOSED" else SupportService(db).get(admin.id, ticket_id, is_admin=True)
    return success_response({"id": ticket.id, "status": ticket.status.value}, "Ticket updated")
