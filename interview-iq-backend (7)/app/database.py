from datetime import datetime, timezone

from sqlalchemy import create_engine, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from app.config import settings


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


engine = create_engine(
    settings.effective_database_url,
    pool_pre_ping=True,
    pool_recycle=1800,
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Shared declarative base for every ORM model in the application."""


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


def get_db():
    """FastAPI dependency that yields a SQLAlchemy session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
