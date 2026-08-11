from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession, Pagination
from app.schemas.roadmap import RoadmapGenerateRequest, RoadmapItemUpdateRequest, RoadmapOut
from app.services.roadmap_service import RoadmapService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/roadmaps", tags=["Roadmaps"])


def _roadmap_out(roadmap) -> dict:
    return RoadmapOut.model_validate(roadmap).model_dump(mode="json") | {"status": roadmap.status.value}


@router.post("/generate", status_code=201)
def generate_roadmap(payload: RoadmapGenerateRequest, db: DbSession, user: CurrentUser):
    roadmap = RoadmapService(db).generate(user, payload)
    return success_response(_roadmap_out(roadmap), "Learning roadmap generated")


@router.get("")
def list_roadmaps(db: DbSession, user: CurrentUser, pagination: Pagination):
    items, total = RoadmapService(db).list_for_user(user, pagination.offset, pagination.page_size)
    page = Page(items=[_roadmap_out(r) for r in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/{roadmap_id}")
def get_roadmap(roadmap_id: int, db: DbSession, user: CurrentUser):
    roadmap = RoadmapService(db).get(user, roadmap_id)
    return success_response(_roadmap_out(roadmap))


@router.patch("/{roadmap_id}")
def update_roadmap(roadmap_id: int, payload: dict, db: DbSession, user: CurrentUser):
    roadmap = RoadmapService(db).update(user, roadmap_id, payload)
    return success_response(_roadmap_out(roadmap), "Roadmap updated")


@router.patch("/{roadmap_id}/items/{item_id}")
def update_roadmap_item(roadmap_id: int, item_id: int, payload: RoadmapItemUpdateRequest, db: DbSession, user: CurrentUser):
    item = RoadmapService(db).update_item(user, roadmap_id, item_id, payload.model_dump(exclude_none=True))
    return success_response({"id": item.id, "title": item.title}, "Roadmap item updated")


@router.post("/{roadmap_id}/items/{item_id}/complete")
def complete_item(roadmap_id: int, item_id: int, db: DbSession, user: CurrentUser):
    item = RoadmapService(db).complete_item(user, roadmap_id, item_id, True)
    return success_response({"id": item.id, "is_completed": item.is_completed}, "Item marked complete")


@router.post("/{roadmap_id}/items/{item_id}/uncomplete")
def uncomplete_item(roadmap_id: int, item_id: int, db: DbSession, user: CurrentUser):
    item = RoadmapService(db).complete_item(user, roadmap_id, item_id, False)
    return success_response({"id": item.id, "is_completed": item.is_completed}, "Item marked incomplete")
