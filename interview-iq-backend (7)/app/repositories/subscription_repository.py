from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subscription import Invoice, PaymentOrder, SubscriptionPlan, UsageRecord, UserSubscription
from app.utils.datetime import current_period_key
from app.utils.enums import SubscriptionStatus


class SubscriptionRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_plans(self) -> list[SubscriptionPlan]:
        return self.db.scalars(
            select(SubscriptionPlan).where(SubscriptionPlan.is_active.is_(True)).order_by(SubscriptionPlan.price_monthly)
        ).all()

    def get_plan_by_code(self, code: str) -> SubscriptionPlan | None:
        plan = self.db.scalar(select(SubscriptionPlan).where(SubscriptionPlan.code == code))
        # Backward-compatible alias for existing clients/bookmarks after Premium was renamed Basic.
        if not plan and code == "PREMIUM":
            return self.db.scalar(select(SubscriptionPlan).where(SubscriptionPlan.code == "BASIC"))
        return plan

    def get_current_subscription(self, user_id: int) -> UserSubscription | None:
        return self.db.scalar(
            select(UserSubscription)
            .where(UserSubscription.user_id == user_id, UserSubscription.status == "ACTIVE")
            .order_by(UserSubscription.created_at.desc())
        )

    def create_subscription(self, **kwargs) -> UserSubscription:
        sub = UserSubscription(**kwargs)
        self.db.add(sub)
        self.db.flush()
        return sub

    def create_payment_order(self, **kwargs) -> PaymentOrder:
        order = PaymentOrder(**kwargs)
        self.db.add(order)
        self.db.flush()
        return order

    def get_payment_order(self, order_id: str) -> PaymentOrder | None:
        return self.db.scalar(select(PaymentOrder).where(PaymentOrder.order_id == order_id))

    def list_payments(self, user_id: int, offset: int, limit: int):
        stmt = select(PaymentOrder).where(PaymentOrder.user_id == user_id).order_by(PaymentOrder.created_at.desc())
        total = len(self.db.scalars(stmt).all())
        return self.db.scalars(stmt.offset(offset).limit(limit)).all(), total

    def get_subscription_by_provider_order(self, order_id: str) -> UserSubscription | None:
        return self.db.scalar(select(UserSubscription).where(UserSubscription.provider_order_id == order_id))

    def invoice_exists_for_provider_payment(self, payment_id: str) -> bool:
        return self.db.scalar(select(Invoice.id).where(Invoice.provider_payment_id == payment_id)) is not None

    def get_by_checkout_session(self, session_id: str) -> UserSubscription | None:
        return self.db.scalar(
            select(UserSubscription).where(UserSubscription.stripe_checkout_session_id == session_id)
        )

    def get_by_stripe_subscription(self, subscription_id: str) -> UserSubscription | None:
        return self.db.scalar(
            select(UserSubscription).where(UserSubscription.stripe_subscription_id == subscription_id)
        )

    def deactivate_current_subscriptions(self, user_id: int) -> None:
        subscriptions = self.db.scalars(
            select(UserSubscription).where(
                UserSubscription.user_id == user_id,
                UserSubscription.status == SubscriptionStatus.ACTIVE,
            )
        ).all()
        for subscription in subscriptions:
            subscription.status = SubscriptionStatus.EXPIRED

    def get_usage_record(self, user_id: int) -> UsageRecord | None:
        return self.db.scalar(
            select(UsageRecord).where(UsageRecord.user_id == user_id, UsageRecord.period_month == current_period_key())
        )

    def create_invoice(self, **kwargs) -> Invoice:
        inv = Invoice(**kwargs)
        self.db.add(inv)
        self.db.flush()
        return inv

    def list_invoices(self, user_id: int, offset: int, limit: int):
        stmt = select(Invoice).where(Invoice.user_id == user_id).order_by(Invoice.issued_at.desc())
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.offset(offset).limit(limit)).all()
        return items, total

    def get_invoice(self, invoice_id: int) -> Invoice | None:
        return self.db.get(Invoice, invoice_id)

    def invoice_exists_for_stripe_event(self, event_id: str) -> bool:
        return self.db.scalar(select(Invoice.id).where(Invoice.stripe_event_id == event_id)) is not None
