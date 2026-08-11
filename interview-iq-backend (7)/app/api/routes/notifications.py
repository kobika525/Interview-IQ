from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession, Pagination
from app.schemas.notification import NotificationOut
from app.services.notification_service import NotificationService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _out(n) -> dict:
    return NotificationOut.model_validate(n).model_dump(mode="json") | {"type": n.type.value}


@router.get("")
def list_notifications(db: DbSession, user: CurrentUser, pagination: Pagination, unread_only: bool = False):
    items, total = NotificationService(db).list(user.id, pagination.offset, pagination.page_size, unread_only)
    page = Page(items=[_out(n) for n in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/unread-count")
def unread_count(db: DbSession, user: CurrentUser):
    return success_response({"count": NotificationService(db).unread_count(user.id)})


@router.patch("/{notification_id}/read")
def mark_read(notification_id: int, db: DbSession, user: CurrentUser):
    n = NotificationService(db).mark_read(user.id, notification_id)
    return success_response(_out(n), "Notification marked as read")


@router.patch("/read-all")
def mark_all_read(db: DbSession, user: CurrentUser):
    NotificationService(db).mark_all_read(user.id)
    return success_response(None, "All notifications marked as read")


@router.delete("/{notification_id}", status_code=204)
def delete_notification(notification_id: int, db: DbSession, user: CurrentUser):
    NotificationService(db).delete(user.id, notification_id)
    return None
