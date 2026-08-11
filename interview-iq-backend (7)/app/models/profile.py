from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin
from app.utils.enums import ExperienceLevel, InterviewMode


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )

    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(150), nullable=True)
    degree: Mapped[str | None] = mapped_column(String(150), nullable=True)
    institute: Mapped[str | None] = mapped_column(String(200), nullable=True)
    study_level: Mapped[ExperienceLevel | None] = mapped_column(nullable=True)

    target_career_role_id: Mapped[int | None] = mapped_column(
        ForeignKey("career_roles.id", ondelete="SET NULL"), nullable=True
    )
    career_goal: Mapped[str | None] = mapped_column(String(255), nullable=True)
    preferred_interview_mode: Mapped[InterviewMode | None] = mapped_column(nullable=True)
    weekly_learning_goal_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)

    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    onboarding_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    avatar_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    user = relationship("User", back_populates="profile")
    target_career_role = relationship("CareerRole")
