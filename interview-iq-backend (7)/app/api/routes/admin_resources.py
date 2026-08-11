from fastapi import APIRouter

from app.dependencies import CurrentAdmin, DbSession, Pagination
from app.schemas.admin import AdminResourceIn, AdminResourceUpdate
from app.services.admin_service import AdminService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/admin/resources", tags=["Admin — Resources"])


def _out(r) -> dict:
    return {
        "id": r.id, "title": r.title, "resource_type": r.resource_type.value, "difficulty": r.difficulty.value,
        "url": r.url, "provider": r.provider, "description": r.description,
        "skill_name": r.skill.name if r.skill else None,
        "estimated_duration_minutes": r.estimated_duration_minutes, "is_premium": r.is_premium,
        "is_published": r.is_published,
    }


@router.post("", status_code=201)
def create_resource(payload: AdminResourceIn, db: DbSession, admin: CurrentAdmin):
    resource = AdminService(db).create_resource(payload.model_dump())
    return success_response(_out(resource), "Resource created")


@router.get("")
def list_resources(db: DbSession, admin: CurrentAdmin, pagination: Pagination):
    items, total = AdminService(db).list_resources_admin(pagination.offset, pagination.page_size)
    page = Page(items=[_out(r) for r in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.patch("/{resource_id}")
def update_resource(resource_id: int, payload: AdminResourceUpdate, db: DbSession, admin: CurrentAdmin):
    resource = AdminService(db).update_resource(resource_id, payload.model_dump(exclude_none=True))
    return success_response(_out(resource), "Resource updated")


@router.delete("/{resource_id}", status_code=204)
def delete_resource(resource_id: int, db: DbSession, admin: CurrentAdmin):
    AdminService(db).delete_resource(resource_id)
    return None
