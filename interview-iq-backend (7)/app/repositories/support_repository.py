from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.support import SupportTicket, TicketMessage


class SupportRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_ticket(self, **kwargs) -> SupportTicket:
        ticket = SupportTicket(**kwargs)
        self.db.add(ticket)
        self.db.flush()
        return ticket

    def add_message(self, **kwargs) -> TicketMessage:
        msg = TicketMessage(**kwargs)
        self.db.add(msg)
        self.db.flush()
        return msg

    def get_ticket(self, ticket_id: int) -> SupportTicket | None:
        return self.db.scalar(
            select(SupportTicket).options(joinedload(SupportTicket.messages)).where(SupportTicket.id == ticket_id)
        )

    def list_for_user(self, user_id: int, offset: int, limit: int):
        stmt = select(SupportTicket).where(SupportTicket.user_id == user_id).order_by(SupportTicket.created_at.desc())
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.offset(offset).limit(limit)).all()
        return items, total

    def list_all_admin(self, offset: int, limit: int, status: str | None = None):
        stmt = select(SupportTicket)
        if status:
            stmt = stmt.where(SupportTicket.status == status)
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.order_by(SupportTicket.created_at.desc()).offset(offset).limit(limit)).all()
        return items, total
