from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, utcnow
from app.utils.enums import Difficulty, RoadmapItemType, RoadmapStatus


class LearningRoadmap(Base, TimestampMixin):
    __tablename__ = "learning_roadmaps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    career_role_id: Mapped[int | None] = mapped_column(ForeignKey("career_roles.id", ondelete="SET NULL"), nullable=True)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[RoadmapStatus] = mapped_column(default=RoadmapStatus.ACTIVE, nullable=False)
    estimated_duration_weeks: Mapped[int] = mapped_column(Integer, default=6, nullable=False)
    completion_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    career_role = relationship("CareerRole")
    items = relationship(
        "RoadmapItem", back_populates="roadmap", cascade="all, delete-orphan",
        order_by="RoadmapItem.order_number",
    )


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    roadmap_id: Mapped[int] = mapped_column(ForeignKey("learning_roadmaps.id", ondelete="CASCADE"), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    item_type: Mapped[RoadmapItemType] = mapped_column(default=RoadmapItemType.COURSE, nullable=False)
    difficulty: Mapped[Difficulty] = mapped_column(default=Difficulty.BEGINNER, nullable=False)
    order_number: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_hours: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    resource_id: Mapped[int | None] = mapped_column(ForeignKey("learning_resources.id", ondelete="SET NULL"), nullable=True)
    is_premium_only: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    roadmap = relationship("LearningRoadmap", back_populates="items")
    resource = relationship("LearningResource")
