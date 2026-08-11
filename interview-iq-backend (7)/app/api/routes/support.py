from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession, Pagination
from app.schemas.support import TicketCreateRequest, TicketMessageRequest, TicketOut
from app.services.support_service import SupportService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/support", tags=["Support"])


def _out(ticket) -> dict:
    return TicketOut.model_validate(ticket).model_dump(mode="json") | {
        "category": ticket.category.value, "status": ticket.status.value,
        "messages": [
            {"id": m.id, "sender": m.sender.value, "message": m.message, "created_at": m.created_at}
            for m in ticket.messages
        ],
    }


@router.post("/tickets", status_code=201)
def create_ticket(payload: TicketCreateRequest, db: DbSession, user: CurrentUser):
    ticket = SupportService(db).create_ticket(user.id, payload)
    return success_response(_out(ticket), "Support ticket created")


@router.get("/tickets")
def list_tickets(db: DbSession, user: CurrentUser, pagination: Pagination):
    items, total = SupportService(db).list_for_user(user.id, pagination.offset, pagination.page_size)
    page = Page(items=[_out(t) for t in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: int, db: DbSession, user: CurrentUser):
    ticket = SupportService(db).get(user.id, ticket_id)
    return success_response(_out(ticket))


@router.post("/tickets/{ticket_id}/messages")
def add_message(ticket_id: int, payload: TicketMessageRequest, db: DbSession, user: CurrentUser):
    ticket = SupportService(db).add_message(user.id, ticket_id, payload.message)
    return success_response(_out(ticket), "Message added")


@router.patch("/tickets/{ticket_id}/close")
def close_ticket(ticket_id: int, db: DbSession, user: CurrentUser):
    ticket = SupportService(db).close(user.id, ticket_id)
    return success_response(_out(ticket), "Ticket closed")
