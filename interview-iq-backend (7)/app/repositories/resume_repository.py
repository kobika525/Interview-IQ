from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.resume import Resume, ResumeAnalysis, ResumeSkill


class ResumeRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Resume:
        resume = Resume(**kwargs)
        self.db.add(resume)
        self.db.flush()
        return resume

    def get_by_id(self, resume_id: int) -> Resume | None:
        return self.db.get(Resume, resume_id)

    def get_with_latest_analysis(self, resume_id: int) -> Resume | None:
        return self.db.scalar(
            select(Resume).options(joinedload(Resume.analyses)).where(Resume.id == resume_id)
        )

    def list_for_user(self, user_id: int, offset: int, limit: int, target_role_id: int | None = None):
        stmt = (
            select(Resume)
            .options(
                selectinload(Resume.analyses)
                .selectinload(ResumeAnalysis.resume_skills)
                .selectinload(ResumeSkill.skill)
            )
            .where(Resume.user_id == user_id)
        )
        if target_role_id:
            stmt = stmt.where(Resume.target_role_id == target_role_id)
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.order_by(Resume.created_at.desc()).offset(offset).limit(limit)).all()
        return items, total

    def delete(self, resume: Resume) -> None:
        self.db.delete(resume)
        self.db.flush()

    def create_analysis(self, **kwargs) -> ResumeAnalysis:
        analysis = ResumeAnalysis(**kwargs)
        self.db.add(analysis)
        self.db.flush()
        return analysis

    def add_resume_skill(self, **kwargs) -> ResumeSkill:
        rs = ResumeSkill(**kwargs)
        self.db.add(rs)
        self.db.flush()
        return rs

    def get_latest_analysis(self, resume_id: int) -> ResumeAnalysis | None:
        return self.db.scalar(
            select(ResumeAnalysis)
            .where(ResumeAnalysis.resume_id == resume_id)
            .order_by(ResumeAnalysis.created_at.desc())
        )
