from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.user import User
from app.repositories.roadmap_repository import RoadmapRepository


class ResourceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = RoadmapRepository(db)

    def list(self, user: User, offset: int, limit: int, search: str | None, resource_type: str | None, difficulty: str | None):
        items, total = self.repo.list_resources(offset, limit, search, resource_type, difficulty)
        bookmarked_ids = self.repo.list_bookmarked_ids(user.id)
        enriched = []
        for r in items:
            progress = self.repo.get_progress(user.id, r.id)
            enriched.append({
                "id": r.id, "title": r.title, "resource_type": r.resource_type.value, "difficulty": r.difficulty.value,
                "url": r.url, "provider": r.provider, "description": r.description,
                "estimated_duration_minutes": r.estimated_duration_minutes, "is_premium": r.is_premium,
                "is_bookmarked": r.id in bookmarked_ids,
                "progress_status": progress.status.value if progress else "NOT_STARTED",
            })
        return enriched, total

    def get(self, resource_id: int):
        resource = self.repo.get_resource(resource_id)
        if not resource:
            raise NotFoundError("Resource not found.")
        return resource

    def bookmark(self, user: User, resource_id: int):
        self.get(resource_id)
        existing = self.repo.get_bookmark(user.id, resource_id)
        if existing:
            return existing
        bookmark = self.repo.add_bookmark(user.id, resource_id)
        self.db.commit()
        return bookmark

    def remove_bookmark(self, user: User, resource_id: int) -> None:
        existing = self.repo.get_bookmark(user.id, resource_id)
        if existing:
            self.repo.remove_bookmark(existing)
            self.db.commit()

    def mark_complete(self, user: User, resource_id: int):
        self.get(resource_id)
        progress = self.repo.upsert_progress(user.id, resource_id, status="COMPLETED")
        self.db.commit()
        return progress

    def list_bookmarks(self, user: User, offset: int, limit: int):
        bookmarked_ids = self.repo.list_bookmarked_ids(user.id)
        all_resources, _ = self.repo.list_resources(0, 500, None, None, None)
        bookmarked = [r for r in all_resources if r.id in bookmarked_ids]
        total = len(bookmarked)
        page = bookmarked[offset: offset + limit]
        return [
            {
                "id": r.id, "title": r.title, "resource_type": r.resource_type.value, "difficulty": r.difficulty.value,
                "url": r.url, "provider": r.provider, "description": r.description,
                "estimated_duration_minutes": r.estimated_duration_minutes, "is_premium": r.is_premium,
                "is_bookmarked": True,
                "progress_status": (self.repo.get_progress(user.id, r.id).status.value if self.repo.get_progress(user.id, r.id) else "NOT_STARTED"),
            }
            for r in page
        ], total
