from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Notification:
        n = Notification(**kwargs)
        self.db.add(n)
        self.db.flush()
        return n

    def list_for_user(self, user_id: int, offset: int, limit: int, unread_only: bool = False):
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read.is_(False))
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.order_by(Notification.created_at.desc()).offset(offset).limit(limit)).all()
        return items, total

    def unread_count(self, user_id: int) -> int:
        stmt = select(Notification).where(Notification.user_id == user_id, Notification.is_read.is_(False))
        return len(self.db.scalars(stmt).all())

    def get_by_id(self, notification_id: int) -> Notification | None:
        return self.db.get(Notification, notification_id)

    def mark_all_read(self, user_id: int) -> None:
        rows = self.db.scalars(
            select(Notification).where(Notification.user_id == user_id, Notification.is_read.is_(False))
        ).all()
        for n in rows:
            n.is_read = True
        self.db.flush()

    def delete(self, notification: Notification) -> None:
        self.db.delete(notification)
        self.db.flush()
