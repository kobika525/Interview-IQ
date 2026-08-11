from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession, Pagination
from app.services.resource_service import ResourceService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.get("")
def list_resources(
    db: DbSession, user: CurrentUser, pagination: Pagination,
    search: str | None = None, resource_type: str | None = None, difficulty: str | None = None,
):
    items, total = ResourceService(db).list(user, pagination.offset, pagination.page_size, search, resource_type, difficulty)
    page = Page(items=items, page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/bookmarks")
def list_bookmarks(db: DbSession, user: CurrentUser, pagination: Pagination):
    items, total = ResourceService(db).list_bookmarks(user, pagination.offset, pagination.page_size)
    page = Page(items=items, page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/{resource_id}")
def get_resource(resource_id: int, db: DbSession):
    resource = ResourceService(db).get(resource_id)
    return success_response({
        "id": resource.id, "title": resource.title, "resource_type": resource.resource_type.value,
        "difficulty": resource.difficulty.value, "url": resource.url, "provider": resource.provider,
        "description": resource.description, "estimated_duration_minutes": resource.estimated_duration_minutes,
        "is_premium": resource.is_premium,
    })


@router.post("/{resource_id}/bookmark", status_code=201)
def bookmark_resource(resource_id: int, db: DbSession, user: CurrentUser):
    ResourceService(db).bookmark(user, resource_id)
    return success_response(None, "Resource bookmarked")


@router.delete("/{resource_id}/bookmark", status_code=204)
def remove_bookmark(resource_id: int, db: DbSession, user: CurrentUser):
    ResourceService(db).remove_bookmark(user, resource_id)
    return None


@router.post("/{resource_id}/complete")
def complete_resource(resource_id: int, db: DbSession, user: CurrentUser):
    ResourceService(db).mark_complete(user, resource_id)
    return success_response(None, "Resource marked as complete")
