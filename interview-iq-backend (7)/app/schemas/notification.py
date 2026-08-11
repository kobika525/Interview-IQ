from datetime import datetime

from app.schemas.common import ORMModel


class NotificationOut(ORMModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    link: str | None
    created_at: datetime
