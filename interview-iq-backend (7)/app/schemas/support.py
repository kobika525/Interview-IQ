from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class TicketCreateRequest(BaseModel):
    subject: str = Field(min_length=3, max_length=200)
    category: str = "OTHER"
    message: str = Field(min_length=5)


class TicketMessageRequest(BaseModel):
    message: str = Field(min_length=1)


class TicketMessageOut(ORMModel):
    id: int
    sender: str
    message: str
    created_at: datetime


class TicketOut(ORMModel):
    id: int
    subject: str
    category: str
    status: str
    created_at: datetime
    updated_at: datetime
    messages: list[TicketMessageOut] = []
