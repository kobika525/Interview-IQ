from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, utcnow
from app.utils.enums import ExperienceLevel, SkillCategory, SkillSource


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    category: Mapped[SkillCategory] = mapped_column(default=SkillCategory.TECHNICAL, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class RoleSkill(Base):
    __tablename__ = "role_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    career_role_id: Mapped[int] = mapped_column(ForeignKey("career_roles.id", ondelete="CASCADE"), index=True, nullable=False)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    skill = relationship("Skill")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=False)
    proficiency: Mapped[ExperienceLevel] = mapped_column(default=ExperienceLevel.BEGINNER, nullable=False)
    source: Mapped[SkillSource] = mapped_column(default=SkillSource.MANUAL, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    skill = relationship("Skill")


class SkillGapAnalysis(Base):
    __tablename__ = "skill_gap_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    career_role_id: Mapped[int] = mapped_column(ForeignKey("career_roles.id", ondelete="CASCADE"), index=True, nullable=False)

    readiness_score: Mapped[float] = mapped_column(Float, nullable=False)
    matched_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    missing_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    priority_gaps: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    beginner_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    intermediate_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    advanced_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    estimated_prep_weeks: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    career_role = relationship("CareerRole")
