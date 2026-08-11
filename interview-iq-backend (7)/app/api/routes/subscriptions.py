from fastapi import APIRouter, Header, Request
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode

from app.config import settings
from app.core.exceptions import ValidationAppError
from app.dependencies import CurrentUser, DbSession
from app.schemas.subscription import CheckoutSessionRequest, DemoUpgradeRequest, PayHereCheckoutRequest, PlanOut
from app.services.subscription_service import SubscriptionService
from app.utils.responses import success_response

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


def _plan_out(plan) -> dict:
    return PlanOut.model_validate(plan).model_dump(mode="json") | {"code": plan.code.value}


@router.get("/plans")
def list_plans(db: DbSession):
    return success_response([_plan_out(plan) for plan in SubscriptionService(db).list_plans()])


@router.get("/current")
def current(db: DbSession, user: CurrentUser):
    data = SubscriptionService(db).current(user.id)
    return success_response({**data, "plan": _plan_out(data["plan"])})


@router.get("/usage")
def usage(db: DbSession, user: CurrentUser):
    return success_response(SubscriptionService(db).usage(user.id))


@router.post("/checkout-session", status_code=201)
def create_checkout_session(payload: CheckoutSessionRequest, db: DbSession, user: CurrentUser):
    data = SubscriptionService(db).create_checkout_session(user, payload.plan_code, payload.billing_cycle)
    return success_response(data, "Stripe Checkout session created")


@router.get("/checkout-session/{session_id}")
def checkout_session_status(session_id: str, db: DbSession, user: CurrentUser):
    return success_response(SubscriptionService(db).checkout_status(user.id, session_id))


@router.post("/payhere/checkout", status_code=201)
def create_payhere_checkout(payload: PayHereCheckoutRequest, db: DbSession, user: CurrentUser):
    data = SubscriptionService(db).create_payhere_checkout(
        user, payload.plan_code, payload.billing_cycle, payload.phone, payload.address, payload.city
    )
    return success_response(data, "PayHere checkout created")


@router.get("/payhere/orders/{order_id}")
def payhere_order_status(order_id: str, db: DbSession, user: CurrentUser):
    return success_response(SubscriptionService(db).payhere_order_status(user.id, order_id))


@router.post("/payhere/notify", include_in_schema=False)
async def payhere_notify(request: Request, db: DbSession):
    form = await request.form()
    SubscriptionService(db).handle_payhere_notification({key: str(value) for key, value in form.items()})
    return {"received": True}


@router.get("/payhere/return", include_in_schema=False)
def payhere_return(order_id: str):
    query = urlencode({"payment": "return", "order_id": order_id})
    return RedirectResponse(f"{settings.FRONTEND_URL.rstrip('/')}/app/checkout?{query}", status_code=303)


@router.get("/payhere/cancel", include_in_schema=False)
def payhere_cancel(order_id: str | None = None):
    query = urlencode({"payment": "cancelled", **({"order_id": order_id} if order_id else {})})
    return RedirectResponse(f"{settings.FRONTEND_URL.rstrip('/')}/app/checkout?{query}", status_code=303)


@router.post("/stripe/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    db: DbSession,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
):
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise ValidationAppError("Stripe webhook signing secret is not configured.")
    if not stripe_signature:
        raise ValidationAppError("Missing Stripe-Signature header.")
    import stripe

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        raise ValidationAppError("Invalid Stripe webhook signature.") from exc
    SubscriptionService(db).handle_stripe_event(event)
    return {"received": True}


@router.post("/demo-upgrade", status_code=201)
def demo_upgrade(payload: DemoUpgradeRequest, db: DbSession, user: CurrentUser):
    SubscriptionService(db).demo_upgrade(user.id, payload.plan_code, payload.billing_cycle)
    return success_response(
        SubscriptionService(db).current(user.id) | {"plan": None},
        "Development demo upgrade completed",
    )


@router.post("/cancel")
def cancel(db: DbSession, user: CurrentUser):
    SubscriptionService(db).cancel(user.id)
    return success_response(None, "Subscription cancellation scheduled")


@router.post("/reactivate")
def reactivate(db: DbSession, user: CurrentUser):
    SubscriptionService(db).reactivate(user.id)
    return success_response(None, "Subscription reactivated")
