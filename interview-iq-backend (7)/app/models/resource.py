from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, utcnow
from app.utils.enums import Difficulty, ResourceProgressStatus, ResourceType


class LearningResource(Base, TimestampMixin):
    __tablename__ = "learning_resources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    skill_id: Mapped[int | None] = mapped_column(ForeignKey("skills.id", ondelete="SET NULL"), nullable=True)
    resource_type: Mapped[ResourceType] = mapped_column(default=ResourceType.COURSE, nullable=False)
    difficulty: Mapped[Difficulty] = mapped_column(default=Difficulty.BEGINNER, nullable=False)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    provider: Mapped[str | None] = mapped_column(String(150), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    skill = relationship("Skill")


class UserResourceProgress(Base):
    __tablename__ = "user_resource_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    resource_id: Mapped[int] = mapped_column(ForeignKey("learning_resources.id", ondelete="CASCADE"), index=True, nullable=False)
    status: Mapped[ResourceProgressStatus] = mapped_column(default=ResourceProgressStatus.NOT_STARTED, nullable=False)
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    resource = relationship("LearningResource")


class ResourceBookmark(Base):
    __tablename__ = "resource_bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "resource_id", name="uq_user_resource_bookmark"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    resource_id: Mapped[int] = mapped_column(ForeignKey("learning_resources.id", ondelete="CASCADE"), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    resource = relationship("LearningResource")
