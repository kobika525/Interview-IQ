from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.resource import LearningResource, ResourceBookmark, UserResourceProgress
from app.models.roadmap import LearningRoadmap, RoadmapItem


class RoadmapRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_roadmap(self, **kwargs) -> LearningRoadmap:
        roadmap = LearningRoadmap(**kwargs)
        self.db.add(roadmap)
        self.db.flush()
        return roadmap

    def add_item(self, **kwargs) -> RoadmapItem:
        item = RoadmapItem(**kwargs)
        self.db.add(item)
        self.db.flush()
        return item

    def list_for_user(self, user_id: int, offset: int, limit: int):
        stmt = (
            select(LearningRoadmap)
            .options(joinedload(LearningRoadmap.items))
            .where(LearningRoadmap.user_id == user_id)
            .order_by(LearningRoadmap.created_at.desc())
        )
        items = self.db.scalars(stmt.offset(offset).limit(limit)).unique().all()
        total = len(self.db.scalars(select(LearningRoadmap).where(LearningRoadmap.user_id == user_id)).all())
        return items, total

    def get_by_id(self, roadmap_id: int) -> LearningRoadmap | None:
        return self.db.scalar(
            select(LearningRoadmap).options(joinedload(LearningRoadmap.items)).where(LearningRoadmap.id == roadmap_id)
        )

    def get_item(self, roadmap_id: int, item_id: int) -> RoadmapItem | None:
        return self.db.scalar(
            select(RoadmapItem).where(RoadmapItem.id == item_id, RoadmapItem.roadmap_id == roadmap_id)
        )

    def recalculate_completion(self, roadmap: LearningRoadmap) -> None:
        total = len(roadmap.items)
        done = len([i for i in roadmap.items if i.is_completed])
        roadmap.completion_percentage = round((done / total) * 100, 1) if total else 0.0
        self.db.flush()

    # --- Resources ---
    def list_resources(self, offset: int, limit: int, search: str | None, resource_type: str | None, difficulty: str | None):
        stmt = select(LearningResource).where(LearningResource.is_published.is_(True))
        if search:
            stmt = stmt.where(LearningResource.title.ilike(f"%{search}%"))
        if resource_type:
            stmt = stmt.where(LearningResource.resource_type == resource_type)
        if difficulty:
            stmt = stmt.where(LearningResource.difficulty == difficulty)
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.order_by(LearningResource.title).offset(offset).limit(limit)).all()
        return items, total

    def get_resource(self, resource_id: int) -> LearningResource | None:
        return self.db.get(LearningResource, resource_id)

    def list_resources_admin(self, offset: int, limit: int):
        """Return both published and draft resources for the admin console."""
        stmt = select(LearningResource)
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(
            stmt.order_by(LearningResource.updated_at.desc()).offset(offset).limit(limit)
        ).all()
        return items, total

    def get_bookmark(self, user_id: int, resource_id: int) -> ResourceBookmark | None:
        return self.db.scalar(
            select(ResourceBookmark).where(
                ResourceBookmark.user_id == user_id, ResourceBookmark.resource_id == resource_id
            )
        )

    def add_bookmark(self, user_id: int, resource_id: int) -> ResourceBookmark:
        bm = ResourceBookmark(user_id=user_id, resource_id=resource_id)
        self.db.add(bm)
        self.db.flush()
        return bm

    def remove_bookmark(self, bookmark: ResourceBookmark) -> None:
        self.db.delete(bookmark)
        self.db.flush()

    def list_bookmarked_ids(self, user_id: int) -> set[int]:
        rows = self.db.scalars(select(ResourceBookmark.resource_id).where(ResourceBookmark.user_id == user_id)).all()
        return set(rows)

    def get_progress(self, user_id: int, resource_id: int) -> UserResourceProgress | None:
        return self.db.scalar(
            select(UserResourceProgress).where(
                UserResourceProgress.user_id == user_id, UserResourceProgress.resource_id == resource_id
            )
        )

    def upsert_progress(self, user_id: int, resource_id: int, **kwargs) -> UserResourceProgress:
        progress = self.get_progress(user_id, resource_id)
        if not progress:
            progress = UserResourceProgress(user_id=user_id, resource_id=resource_id)
            self.db.add(progress)
        for k, v in kwargs.items():
            setattr(progress, k, v)
        self.db.flush()
        return progress
