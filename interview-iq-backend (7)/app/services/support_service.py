from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationAppError
from app.repositories.support_repository import SupportRepository
from app.utils.enums import MessageSender, TicketStatus


class SupportService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SupportRepository(db)

    def create_ticket(self, user_id: int, data):
        ticket = self.repo.create_ticket(user_id=user_id, subject=data.subject, category=data.category, status=TicketStatus.OPEN)
        self.repo.add_message(ticket_id=ticket.id, sender=MessageSender.USER, message=data.message)
        self.db.commit()
        return self.repo.get_ticket(ticket.id)

    def list_for_user(self, user_id: int, offset: int, limit: int):
        return self.repo.list_for_user(user_id, offset, limit)

    def _ensure_owned(self, ticket, user_id: int, is_admin: bool = False):
        if not ticket:
            raise NotFoundError("Support ticket not found.")
        if ticket.user_id != user_id and not is_admin:
            raise ForbiddenError("You don't have access to this ticket.")
        return ticket

    def get(self, user_id: int, ticket_id: int, is_admin: bool = False):
        return self._ensure_owned(self.repo.get_ticket(ticket_id), user_id, is_admin)

    def add_message(self, user_id: int, ticket_id: int, message: str, is_admin: bool = False):
        ticket = self.get(user_id, ticket_id, is_admin)
        if ticket.status == TicketStatus.CLOSED:
            raise ValidationAppError("This ticket is closed. Please open a new ticket.")
        sender = MessageSender.ADMIN if is_admin else MessageSender.USER
        self.repo.add_message(ticket_id=ticket.id, sender=sender, message=message)
        self.db.commit()
        return self.repo.get_ticket(ticket_id)

    def close(self, user_id: int, ticket_id: int, is_admin: bool = False):
        ticket = self.get(user_id, ticket_id, is_admin)
        ticket.status = TicketStatus.CLOSED
        self.db.commit()
        return ticket

    def list_all_admin(self, offset: int, limit: int, status: str | None = None):
        return self.repo.list_all_admin(offset, limit, status)
