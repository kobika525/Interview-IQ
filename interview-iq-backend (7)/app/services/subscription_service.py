from datetime import datetime, timedelta, timezone
from decimal import Decimal
import hashlib
import hmac
from uuid import uuid4

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import NotFoundError, ValidationAppError
from app.core.permissions import _get_or_create_usage_record, get_active_plan
from app.repositories.subscription_repository import SubscriptionRepository
from app.services.notification_service import NotificationService
from app.utils.datetime import current_period_key, utcnow
from app.utils.enums import NotificationType, SubscriptionStatus


class SubscriptionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SubscriptionRepository(db)
        self.notifications = NotificationService(db)

    def list_plans(self):
        return self.repo.list_plans()

    def current(self, user_id: int):
        plan = get_active_plan(self.db, user_id)
        sub = self.repo.get_current_subscription(user_id)
        return {
            "plan": plan,
            "status": sub.status.value if sub else SubscriptionStatus.ACTIVE.value,
            "billing_cycle": sub.billing_cycle if sub else "month",
            "renews_at": sub.renews_at if sub else None,
            "cancelled_at": sub.cancelled_at if sub else None,
        }

    def usage(self, user_id: int):
        plan = get_active_plan(self.db, user_id)
        record = _get_or_create_usage_record(self.db, user_id)
        self.db.commit()
        return {
            "period_month": current_period_key().isoformat(),
            "resume_scans_used": record.resume_scans_used, "resume_scan_limit": plan.resume_scan_limit,
            "text_interviews_used": record.text_interviews_used, "text_interview_limit": plan.text_interview_limit,
            "voice_interviews_used": record.voice_interviews_used, "voice_interview_limit": plan.voice_interview_limit,
            "video_interviews_used": record.video_interviews_used, "video_interview_limit": plan.video_interview_limit,
        }

    def demo_upgrade(self, user_id: int, plan_code: str, billing_cycle: str):
        if settings.APP_ENV.lower() != "development" or settings.PAYMENT_MODE.lower() != "demo":
            raise ValidationAppError("Demo upgrades are disabled. Use the configured payment provider.")
        plan = self.repo.get_plan_by_code(plan_code.upper())
        if not plan:
            raise NotFoundError(f"Plan '{plan_code}' not found.")

        renews_at = utcnow() + (timedelta(days=365) if billing_cycle == "year" else timedelta(days=30))
        subscription = self.repo.create_subscription(
            user_id=user_id, plan_id=plan.id, status=SubscriptionStatus.ACTIVE,
            billing_cycle=billing_cycle, renews_at=renews_at,
        )
        amount = plan.price_yearly if billing_cycle == "year" else plan.price_monthly
        self.repo.create_invoice(
            user_id=user_id, subscription_id=subscription.id, plan_name=plan.name,
            amount=amount, status="PAID", is_demo=True,
        )
        self.notifications.create(
            user_id=user_id, type=NotificationType.SUBSCRIPTION, title="Subscription upgraded",
            message=f"You're now on the {plan.name} plan (demo upgrade — no real payment was processed).",
        )
        self.db.commit()
        return subscription

    def _stripe(self):
        if settings.PAYMENT_MODE.lower() != "stripe":
            raise ValidationAppError("Stripe payments are not enabled.")
        if not settings.STRIPE_SECRET_KEY:
            raise ValidationAppError("Stripe is not configured on the server.")
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY
        return stripe

    def create_checkout_session(self, user, plan_code: str, billing_cycle: str) -> dict:
        stripe = self._stripe()
        cycle = billing_cycle.lower()
        if cycle not in ("month", "year"):
            raise ValidationAppError("Billing cycle must be 'month' or 'year'.")
        plan = self.repo.get_plan_by_code(plan_code.upper())
        if not plan or plan.code.value == "FREE":
            raise ValidationAppError("Choose a paid subscription plan.")
        amount = plan.price_yearly if cycle == "year" else plan.price_monthly
        unit_amount = int(amount * 100)
        if unit_amount <= 0:
            raise ValidationAppError("This plan does not have a valid Stripe price.")

        metadata = {
            "user_id": str(user.id),
            "plan_code": plan.code.value,
            "billing_cycle": cycle,
        }
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer_email=user.email,
            client_reference_id=str(user.id),
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": unit_amount,
                    "recurring": {"interval": cycle},
                    "product_data": {"name": f"Interview IQ {plan.name}"},
                },
                "quantity": 1,
            }],
            metadata=metadata,
            subscription_data={"metadata": metadata},
            success_url=settings.STRIPE_SUCCESS_URL,
            cancel_url=settings.STRIPE_CANCEL_URL,
        )
        return {"session_id": session.id, "checkout_url": session.url}

    def checkout_status(self, user_id: int, session_id: str) -> dict:
        stripe = self._stripe()
        session = stripe.checkout.Session.retrieve(session_id)
        if str(session.get("client_reference_id")) != str(user_id):
            raise NotFoundError("Checkout session not found.")
        local = self.repo.get_by_checkout_session(session_id)
        return {
            "session_id": session_id,
            "payment_status": session.get("payment_status", "unpaid"),
            "subscription_active": bool(local and local.status == SubscriptionStatus.ACTIVE),
        }

    @staticmethod
    def _payhere_md5(value: str) -> str:
        return hashlib.md5(value.encode("utf-8")).hexdigest().upper()  # noqa: S324 - required by PayHere protocol

    def _require_payhere(self) -> None:
        if settings.PAYMENT_MODE.lower() != "payhere":
            raise ValidationAppError("PayHere payments are not enabled.")
        if not settings.PAYHERE_SANDBOX:
            raise ValidationAppError("Live PayHere payments are disabled. Set PAYHERE_SANDBOX=true.")
        if not settings.PAYHERE_MERCHANT_ID or not settings.PAYHERE_MERCHANT_SECRET:
            raise ValidationAppError("PayHere merchant credentials are not configured on the server.")
        if not settings.PAYHERE_NOTIFY_URL or "localhost" in settings.PAYHERE_NOTIFY_URL:
            raise ValidationAppError("PAYHERE_NOTIFY_URL must be a public URL; PayHere cannot notify localhost.")

    def create_payhere_checkout(
        self, user, plan_code: str, billing_cycle: str, phone: str, address: str, city: str
    ) -> dict:
        self._require_payhere()
        cycle = billing_cycle.lower()
        if cycle not in ("month", "year"):
            raise ValidationAppError("Billing cycle must be 'month' or 'year'.")
        if not all(value.strip() for value in (phone, address, city)):
            raise ValidationAppError("Phone, address, and city are required by PayHere.")
        plan = self.repo.get_plan_by_code(plan_code.upper())
        if not plan or plan.code.value == "FREE":
            raise ValidationAppError("Choose a paid subscription plan.")

        amount = plan.price_yearly if cycle == "year" else plan.price_monthly
        amount_text = f"{Decimal(amount):.2f}"
        if Decimal(amount) <= 0:
            raise ValidationAppError("This plan does not have a valid payment amount.")
        currency = settings.PAYHERE_CURRENCY.upper()
        order_id = f"IQ-{user.id}-{uuid4().hex[:16].upper()}"
        secret_hash = self._payhere_md5(settings.PAYHERE_MERCHANT_SECRET)
        payment_hash = self._payhere_md5(
            f"{settings.PAYHERE_MERCHANT_ID}{order_id}{amount_text}{currency}{secret_hash}"
        )
        names = user.full_name.strip().split(maxsplit=1)
        self.repo.create_payment_order(
            order_id=order_id, user_id=user.id, plan_id=plan.id, billing_cycle=cycle,
            plan_name=plan.name, amount=amount, currency=currency, status="PENDING",
        )
        self.db.commit()
        gateway = "https://sandbox.payhere.lk/pay/checkout"
        return {
            "provider": "payhere",
            "order_id": order_id,
            "checkout_url": gateway,
            "fields": {
                "merchant_id": settings.PAYHERE_MERCHANT_ID,
                "return_url": settings.PAYHERE_RETURN_URL.replace("{ORDER_ID}", order_id),
                "cancel_url": settings.PAYHERE_CANCEL_URL.replace("{ORDER_ID}", order_id),
                "notify_url": settings.PAYHERE_NOTIFY_URL,
                "first_name": names[0],
                "last_name": names[1] if len(names) > 1 else "-",
                "email": user.email,
                "phone": phone.strip(),
                "address": address.strip(),
                "city": city.strip(),
                "country": settings.PAYHERE_COUNTRY,
                "order_id": order_id,
                "items": f"Interview IQ {plan.name}",
                "currency": currency,
                "amount": amount_text,
                "recurrence": "1 Year" if cycle == "year" else "1 Month",
                "duration": "Forever",
                "hash": payment_hash,
            },
        }

    def payhere_order_status(self, user_id: int, order_id: str) -> dict:
        order = self.repo.get_payment_order(order_id)
        if not order or order.user_id != user_id:
            raise NotFoundError("Payment order not found.")
        subscription = self.repo.get_subscription_by_provider_order(order_id)
        return {
            "order_id": order.order_id,
            "payment_status": order.status.lower(),
            "subscription_active": bool(subscription and subscription.status == SubscriptionStatus.ACTIVE),
        }

    def handle_payhere_notification(self, data: dict[str, str]) -> None:
        self._require_payhere()
        required = ("merchant_id", "order_id", "payhere_amount", "payhere_currency", "status_code", "md5sig")
        if any(not data.get(key) for key in required):
            raise ValidationAppError("Incomplete PayHere notification.")
        signature = self._payhere_md5(
            f"{data['merchant_id']}{data['order_id']}{data['payhere_amount']}"
            f"{data['payhere_currency']}{data['status_code']}"
            f"{self._payhere_md5(settings.PAYHERE_MERCHANT_SECRET)}"
        )
        if data["merchant_id"] != settings.PAYHERE_MERCHANT_ID or not hmac.compare_digest(signature, data["md5sig"].upper()):
            raise ValidationAppError("Invalid PayHere notification signature.")
        order = self.repo.get_payment_order(data["order_id"])
        if not order:
            raise NotFoundError("Payment order not found.")
        if f"{Decimal(order.amount):.2f}" != data["payhere_amount"] or order.currency != data["payhere_currency"].upper():
            raise ValidationAppError("PayHere amount or currency does not match the order.")

        statuses = {"2": "PAID", "0": "PENDING", "-1": "CANCELLED", "-2": "FAILED", "-3": "CHARGEBACK"}
        incoming_status = statuses.get(data["status_code"], "FAILED")
        # A delayed/replayed non-success callback must never downgrade a completed payment.
        if order.status == "PAID" and incoming_status != "PAID":
            return
        order.status = incoming_status
        payment_id = data.get("payment_id") or None
        if payment_id:
            duplicate = self.db.scalar(select(type(order).id).where(
                type(order).payment_id == payment_id, type(order).id != order.id
            ))
            if duplicate:
                raise ValidationAppError("This PayHere payment has already been processed.")
        order.payment_id = payment_id
        order.payment_method = data.get("method") or data.get("payment_method") or None
        order.provider_subscription_id = data.get("subscription_id") or None
        if data["status_code"] == "2":
            existing = self.repo.get_subscription_by_provider_order(order.order_id)
            if not existing:
                self.repo.deactivate_current_subscriptions(order.user_id)
                renews_at = utcnow() + (timedelta(days=365) if order.billing_cycle == "year" else timedelta(days=30))
                subscription = self.repo.create_subscription(
                    user_id=order.user_id, plan_id=order.plan_id, status=SubscriptionStatus.ACTIVE,
                    billing_cycle=order.billing_cycle, renews_at=renews_at, payment_provider="payhere",
                    provider_subscription_id=order.provider_subscription_id, provider_order_id=order.order_id,
                )
                self.repo.create_invoice(
                    user_id=order.user_id, subscription_id=subscription.id, plan_name=order.plan.name,
                    amount=order.amount, status="PAID", is_demo=False, provider_payment_id=payment_id,
                )
                self.notifications.create(
                    user_id=order.user_id, type=NotificationType.SUBSCRIPTION, title="Payment confirmed",
                    message=f"Your {order.plan.name} subscription is now active.",
                )
            elif payment_id and not self.repo.invoice_exists_for_provider_payment(payment_id):
                next_date = data.get("item_rec_date_next")
                if next_date:
                    try:
                        existing.renews_at = datetime.strptime(next_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                    except ValueError:
                        pass
                self.repo.create_invoice(
                    user_id=order.user_id, subscription_id=existing.id, plan_name=order.plan.name,
                    amount=order.amount, status="PAID", is_demo=False, provider_payment_id=payment_id,
                )
        elif data["status_code"] == "-3":
            subscription = self.repo.get_subscription_by_provider_order(order.order_id)
            if subscription:
                subscription.status = SubscriptionStatus.EXPIRED
                subscription.cancelled_at = utcnow()
        if data.get("message_type") in ("RECURRING_COMPLETE", "RECURRING_STOPPED"):
            subscription = self.repo.get_subscription_by_provider_order(order.order_id)
            if subscription:
                subscription.status = SubscriptionStatus.EXPIRED
                subscription.cancelled_at = utcnow()
        self.db.commit()

    def _cancel_payhere_subscription(self, subscription_id: str) -> None:
        if not settings.PAYHERE_APP_ID or not settings.PAYHERE_APP_SECRET:
            raise ValidationAppError(
                "PayHere cancellation is not configured. Add PAYHERE_APP_ID and PAYHERE_APP_SECRET."
            )
        base = "https://sandbox.payhere.lk" if settings.PAYHERE_SANDBOX else "https://www.payhere.lk"
        try:
            with httpx.Client(timeout=15) as client:
                token_response = client.post(
                    f"{base}/merchant/v1/oauth/token",
                    data={"grant_type": "client_credentials"},
                    auth=(settings.PAYHERE_APP_ID, settings.PAYHERE_APP_SECRET),
                )
                token_response.raise_for_status()
                token = token_response.json()["access_token"]
                cancel_response = client.post(
                    f"{base}/merchant/v1/subscription/cancel",
                    json={"subscription_id": subscription_id},
                    headers={"Authorization": f"Bearer {token}"},
                )
                cancel_response.raise_for_status()
                result = cancel_response.json()
        except (httpx.HTTPError, KeyError, ValueError) as exc:
            raise ValidationAppError("PayHere could not cancel the recurring subscription. Try again later.") from exc
        if result.get("status") != 1:
            raise ValidationAppError(result.get("msg") or "PayHere rejected the cancellation.")

    def handle_stripe_event(self, event) -> None:
        event_type = event["type"]
        data = event["data"]["object"]
        event_id = event["id"]

        if event_type == "checkout.session.completed" and data.get("payment_status") == "paid":
            if self.repo.get_by_checkout_session(data["id"]):
                return
            metadata = data.get("metadata") or {}
            user_id = int(metadata["user_id"])
            plan = self.repo.get_plan_by_code(metadata["plan_code"].upper())
            if not plan:
                raise NotFoundError("Stripe checkout references an unknown plan.")
            cycle = metadata.get("billing_cycle", "month")
            renews_at = utcnow() + (timedelta(days=365) if cycle == "year" else timedelta(days=30))
            self.repo.deactivate_current_subscriptions(user_id)
            subscription = self.repo.create_subscription(
                user_id=user_id,
                plan_id=plan.id,
                status=SubscriptionStatus.ACTIVE,
                billing_cycle=cycle,
                renews_at=renews_at,
                payment_provider="stripe",
                stripe_customer_id=data.get("customer"),
                stripe_subscription_id=data.get("subscription"),
                stripe_checkout_session_id=data["id"],
            )
            amount = plan.price_yearly if cycle == "year" else plan.price_monthly
            self.repo.create_invoice(
                user_id=user_id,
                subscription_id=subscription.id,
                plan_name=plan.name,
                amount=amount,
                status="PAID",
                is_demo=False,
                stripe_event_id=event_id,
            )
            self.notifications.create(
                user_id=user_id,
                type=NotificationType.SUBSCRIPTION,
                title="Payment confirmed",
                message=f"Your {plan.name} subscription is now active.",
            )
            self.db.commit()
            return

        if event_type == "invoice.paid" and data.get("billing_reason") != "subscription_create":
            subscription = self.repo.get_by_stripe_subscription(data.get("subscription", ""))
            if not subscription or self.repo.invoice_exists_for_stripe_event(event_id):
                return
            period_end = data.get("period_end")
            if period_end:
                subscription.renews_at = datetime.fromtimestamp(period_end, tz=timezone.utc)
            self.repo.create_invoice(
                user_id=subscription.user_id,
                subscription_id=subscription.id,
                plan_name=subscription.plan.name,
                amount=(data.get("amount_paid") or 0) / 100,
                status="PAID",
                is_demo=False,
                stripe_event_id=event_id,
            )
            self.db.commit()
            return

        if event_type == "customer.subscription.deleted":
            subscription = self.repo.get_by_stripe_subscription(data.get("id", ""))
            if subscription:
                subscription.status = SubscriptionStatus.EXPIRED
                subscription.cancelled_at = utcnow()
                self.db.commit()

    def cancel(self, user_id: int):
        sub = self.repo.get_current_subscription(user_id)
        if not sub:
            raise ValidationAppError("No active subscription to cancel.")
        if sub.payment_provider == "stripe" and sub.stripe_subscription_id:
            stripe = self._stripe()
            stripe.Subscription.modify(sub.stripe_subscription_id, cancel_at_period_end=True)
        elif sub.payment_provider == "payhere" and sub.provider_subscription_id:
            self._cancel_payhere_subscription(sub.provider_subscription_id)
            sub.status = SubscriptionStatus.CANCELLED
        else:
            sub.status = SubscriptionStatus.CANCELLED
        sub.cancelled_at = utcnow()
        self.notifications.create(
            user_id=user_id, type=NotificationType.SUBSCRIPTION, title="Subscription cancelled",
            message="Your subscription has been cancelled. You'll keep access until the end of the billing period.",
        )
        self.db.commit()
        return sub

    def reactivate(self, user_id: int):
        sub = self.repo.get_current_subscription(user_id)
        if sub and sub.status == SubscriptionStatus.ACTIVE:
            raise ValidationAppError("Subscription is already active.")
        last_plan = sub.plan if sub else self.repo.get_plan_by_code("BASIC")
        return self.demo_upgrade(user_id, last_plan.code.value if hasattr(last_plan.code, "value") else last_plan.code, "month")

    def list_invoices(self, user_id: int, offset: int, limit: int):
        return self.repo.list_invoices(user_id, offset, limit)

    def list_payments(self, user_id: int, offset: int, limit: int):
        return self.repo.list_payments(user_id, offset, limit)

    def get_invoice(self, user_id: int, invoice_id: int):
        invoice = self.repo.get_invoice(invoice_id)
        if not invoice or invoice.user_id != user_id:
            raise NotFoundError("Invoice not found.")
        return invoice
