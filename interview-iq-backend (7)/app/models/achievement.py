from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utcnow


class Achievement(Base):
    """Admin/seed-managed achievement catalogue. `condition_key` is matched by
    centralized code in services/progress_service.py (see ACHIEVEMENT_CHECKS)."""

    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(40), default="award", nullable=False)
    condition_key: Mapped[str] = mapped_column(String(60), nullable=False)
    condition_value: Mapped[int] = mapped_column(Integer, default=1, nullable=False)


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    achievement = relationship("Achievement")
