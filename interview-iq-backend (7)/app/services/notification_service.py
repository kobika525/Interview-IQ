from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.repositories.notification_repository import NotificationRepository


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository(db)

    def create(self, *, user_id: int, type, title: str, message: str, link: str | None = None):
        """Helper used by other services to raise a notification as a side effect."""
        return self.repo.create(user_id=user_id, type=type, title=title, message=message, link=link)

    def list(self, user_id: int, offset: int, limit: int, unread_only: bool = False):
        return self.repo.list_for_user(user_id, offset, limit, unread_only)

    def unread_count(self, user_id: int) -> int:
        return self.repo.unread_count(user_id)

    def mark_read(self, user_id: int, notification_id: int):
        notification = self.repo.get_by_id(notification_id)
        if not notification or notification.user_id != user_id:
            raise NotFoundError("Notification not found.")
        notification.is_read = True
        self.db.commit()
        return notification

    def mark_all_read(self, user_id: int) -> None:
        self.repo.mark_all_read(user_id)
        self.db.commit()

    def delete(self, user_id: int, notification_id: int) -> None:
        notification = self.repo.get_by_id(notification_id)
        if not notification or notification.user_id != user_id:
            raise NotFoundError("Notification not found.")
        self.repo.delete(notification)
        self.db.commit()
