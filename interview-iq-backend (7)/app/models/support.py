from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, utcnow
from app.utils.enums import MessageSender, TicketCategory, TicketStatus


class SupportTicket(Base, TimestampMixin):
    __tablename__ = "support_tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[TicketCategory] = mapped_column(default=TicketCategory.OTHER, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(default=TicketStatus.OPEN, nullable=False)

    messages = relationship(
        "TicketMessage", back_populates="ticket", cascade="all, delete-orphan",
        order_by="TicketMessage.created_at",
    )


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("support_tickets.id", ondelete="CASCADE"), index=True, nullable=False)
    sender: Mapped[MessageSender] = mapped_column(default=MessageSender.USER, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    ticket = relationship("SupportTicket", back_populates="messages")
