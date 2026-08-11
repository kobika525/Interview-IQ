from fastapi import APIRouter

from app.dependencies import CurrentAdmin, DbSession, Pagination
from app.schemas.admin import AdminUserOut, AdminUserStatusRequest, AdminUserUpdateRequest
from app.services.admin_service import AdminService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/admin/users", tags=["Admin — Users"])


def _out(user) -> dict:
    return AdminUserOut.model_validate(user).model_dump(mode="json") | {
        "role": user.role.value, "account_status": user.account_status.value,
    }


@router.get("")
def list_users(db: DbSession, admin: CurrentAdmin, pagination: Pagination, search: str | None = None):
    items, total = AdminService(db).list_users(pagination.offset, pagination.page_size, search)
    page = Page(items=[_out(u) for u in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/{user_id}")
def get_user(user_id: int, db: DbSession, admin: CurrentAdmin):
    return success_response(_out(AdminService(db).get_user(user_id)))


@router.patch("/{user_id}")
def update_user(user_id: int, payload: AdminUserUpdateRequest, db: DbSession, admin: CurrentAdmin):
    user = AdminService(db).update_user(user_id, payload.model_dump(exclude_none=True))
    return success_response(_out(user), "User updated")


@router.patch("/{user_id}/status")
def update_status(user_id: int, payload: AdminUserStatusRequest, db: DbSession, admin: CurrentAdmin):
    user = AdminService(db).update_user_status(user_id, payload.account_status)
    return success_response(_out(user), "User status updated")


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: DbSession, admin: CurrentAdmin):
    AdminService(db).delete_user(user_id)
    return None
