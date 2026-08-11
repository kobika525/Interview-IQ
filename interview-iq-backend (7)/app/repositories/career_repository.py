from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.career import CareerMatch, CareerRole
from app.models.skill import RoleSkill, Skill, SkillGapAnalysis, UserSkill


class CareerRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_roles(self, offset: int = 0, limit: int = 100, active_only: bool = True):
        stmt = select(CareerRole)
        if active_only:
            stmt = stmt.where(CareerRole.is_active.is_(True))
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.order_by(CareerRole.title).offset(offset).limit(limit)).all()
        return items, total

    def get_role(self, role_id: int) -> CareerRole | None:
        return self.db.get(CareerRole, role_id)

    def get_role_by_slug(self, slug: str) -> CareerRole | None:
        return self.db.scalar(select(CareerRole).where(CareerRole.slug == slug))

    def create_role(self, **kwargs) -> CareerRole:
        role = CareerRole(**kwargs)
        self.db.add(role)
        self.db.flush()
        return role

    def get_role_skills(self, role_id: int) -> list[RoleSkill]:
        return self.db.scalars(select(RoleSkill).where(RoleSkill.career_role_id == role_id)).all()

    def get_or_create_skill(self, name: str, category: str = "TECHNICAL") -> Skill:
        skill = self.db.scalar(select(Skill).where(Skill.name.ilike(name.strip())))
        if not skill:
            skill = Skill(name=name.strip(), category=category)
            self.db.add(skill)
            self.db.flush()
        return skill

    def get_user_skills(self, user_id: int) -> list[UserSkill]:
        return self.db.scalars(select(UserSkill).where(UserSkill.user_id == user_id)).all()

    def add_user_skill(self, **kwargs) -> UserSkill:
        us = UserSkill(**kwargs)
        self.db.add(us)
        self.db.flush()
        return us

    def create_match(self, **kwargs) -> CareerMatch:
        match = CareerMatch(**kwargs)
        self.db.add(match)
        self.db.flush()
        return match

    def list_matches(self, user_id: int, offset: int, limit: int):
        stmt = select(CareerMatch).where(CareerMatch.user_id == user_id).order_by(CareerMatch.created_at.desc())
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.offset(offset).limit(limit)).all()
        return items, total

    def get_match(self, match_id: int) -> CareerMatch | None:
        return self.db.get(CareerMatch, match_id)

    def create_skill_gap(self, **kwargs) -> SkillGapAnalysis:
        gap = SkillGapAnalysis(**kwargs)
        self.db.add(gap)
        self.db.flush()
        return gap

    def list_skill_gaps(self, user_id: int, offset: int, limit: int):
        stmt = (
            select(SkillGapAnalysis)
            .where(SkillGapAnalysis.user_id == user_id)
            .order_by(SkillGapAnalysis.created_at.desc())
        )
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.offset(offset).limit(limit)).all()
        return items, total

    def get_skill_gap(self, analysis_id: int) -> SkillGapAnalysis | None:
        return self.db.get(SkillGapAnalysis, analysis_id)
