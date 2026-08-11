from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession, Pagination
from app.schemas.subscription import InvoiceOut, PaymentOut
from app.services.subscription_service import SubscriptionService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/invoices")
def list_invoices(db: DbSession, user: CurrentUser, pagination: Pagination):
    items, total = SubscriptionService(db).list_invoices(user.id, pagination.offset, pagination.page_size)
    page = Page(
        items=[InvoiceOut.model_validate(i).model_dump(mode="json") | {"status": i.status.value} for i in items],
        page=pagination.page, page_size=pagination.page_size, total_items=total,
    )
    return list_response(page)


@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: int, db: DbSession, user: CurrentUser):
    invoice = SubscriptionService(db).get_invoice(user.id, invoice_id)
    return success_response(InvoiceOut.model_validate(invoice).model_dump(mode="json") | {"status": invoice.status.value})


@router.get("/payments")
def list_payments(db: DbSession, user: CurrentUser, pagination: Pagination):
    items, total = SubscriptionService(db).list_payments(user.id, pagination.offset, pagination.page_size)
    page = Page(
        items=[PaymentOut.model_validate(item).model_dump(mode="json") for item in items],
        page=pagination.page, page_size=pagination.page_size, total_items=total,
    )
    return list_response(page)
