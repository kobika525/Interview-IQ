from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, utcnow
from app.utils.enums import ExperienceLevel


class CareerRole(Base, TimestampMixin):
    __tablename__ = "career_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(170), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    responsibilities: Mapped[str | None] = mapped_column(Text, nullable=True)
    experience_level: Mapped[ExperienceLevel] = mapped_column(default=ExperienceLevel.BEGINNER, nullable=False)
    demand_level: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False)
    avg_salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    avg_salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_learning_duration_weeks: Mapped[int] = mapped_column(Integer, default=8, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    role_skills = relationship("RoleSkill", cascade="all, delete-orphan")


class CareerMatch(Base):
    __tablename__ = "career_matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    career_role_id: Mapped[int] = mapped_column(ForeignKey("career_roles.id", ondelete="CASCADE"), index=True, nullable=False)
    resume_id: Mapped[int | None] = mapped_column(ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    match_score: Mapped[float] = mapped_column(Float, nullable=False)
    matched_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    missing_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    priority_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    career_role = relationship("CareerRole")
