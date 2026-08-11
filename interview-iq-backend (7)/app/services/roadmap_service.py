from sqlalchemy.orm import Session

from app.ai.career.roadmap_generator import generate_roadmap_items
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.permissions import require_plan_feature
from app.models.user import User
from app.repositories.career_repository import CareerRepository
from app.repositories.roadmap_repository import RoadmapRepository
from app.utils.datetime import utcnow


class RoadmapService:
    def __init__(self, db: Session):
        self.db = db
        self.roadmaps = RoadmapRepository(db)
        self.careers = CareerRepository(db)

    def generate(self, user: User, data):
        require_plan_feature(self.db, user.id, "roadmap_access")
        role = self.careers.get_role(data.career_role_id)
        if not role:
            raise NotFoundError("Career role not found.")

        gap = None
        if data.skill_gap_analysis_id:
            gap = self.careers.get_skill_gap(data.skill_gap_analysis_id)
            if not gap or gap.user_id != user.id:
                raise NotFoundError("Skill gap analysis not found.")

        if not gap:
            role_skills = self.careers.get_role_skills(role.id)
            missing = [rs.skill.name for rs in role_skills if rs.is_required]
            beginner_skills, intermediate_skills, advanced_skills = missing[:2], missing[2:4], missing[4:]
        else:
            missing = gap.missing_skills
            beginner_skills, intermediate_skills, advanced_skills = gap.beginner_skills, gap.intermediate_skills, gap.advanced_skills

        resource_rows, _ = self.roadmaps.list_resources(0, 200, None, None, None)
        resource_lookup = {r.title.lower(): r.id for r in resource_rows}

        items_data, estimated_weeks = generate_roadmap_items(
            missing_skills=missing, beginner_skills=beginner_skills, intermediate_skills=intermediate_skills,
            advanced_skills=advanced_skills, weekly_hours=data.weekly_learning_goal_hours,
            resource_lookup=resource_lookup,
        )

        roadmap = self.roadmaps.create_roadmap(
            user_id=user.id, career_role_id=role.id, title=f"{role.title} Learning Roadmap",
            estimated_duration_weeks=estimated_weeks,
        )
        for item in items_data:
            self.roadmaps.add_item(roadmap_id=roadmap.id, **item)
        self.db.commit()
        return self.roadmaps.get_by_id(roadmap.id)

    def list_for_user(self, user: User, offset: int, limit: int):
        return self.roadmaps.list_for_user(user.id, offset, limit)

    def _ensure_owned(self, roadmap, user: User):
        if not roadmap:
            raise NotFoundError("Roadmap not found.")
        if roadmap.user_id != user.id:
            raise ForbiddenError("You don't have access to this roadmap.")
        return roadmap

    def get(self, user: User, roadmap_id: int):
        return self._ensure_owned(self.roadmaps.get_by_id(roadmap_id), user)

    def update(self, user: User, roadmap_id: int, data: dict):
        roadmap = self.get(user, roadmap_id)
        for field in ["title", "status"]:
            if data.get(field):
                setattr(roadmap, field, data[field])
        self.db.commit()
        return roadmap

    def update_item(self, user: User, roadmap_id: int, item_id: int, data: dict):
        roadmap = self.get(user, roadmap_id)
        item = self.roadmaps.get_item(roadmap_id, item_id)
        if not item:
            raise NotFoundError("Roadmap item not found.")
        for field, value in data.items():
            if value is not None:
                setattr(item, field, value)
        self.db.commit()
        return item

    def complete_item(self, user: User, roadmap_id: int, item_id: int, completed: bool):
        roadmap = self.get(user, roadmap_id)
        item = self.roadmaps.get_item(roadmap_id, item_id)
        if not item:
            raise NotFoundError("Roadmap item not found.")
        item.is_completed = completed
        item.completed_at = utcnow() if completed else None
        self.roadmaps.recalculate_completion(roadmap)
        self.db.commit()
        return item
