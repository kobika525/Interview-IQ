from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, utcnow
from app.utils.enums import InvoiceStatus, PlanCode, SubscriptionStatus


class SubscriptionPlan(Base, TimestampMixin):
    """Database-managed plan definitions. Limits are None = unlimited, 0 = feature disabled."""

    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[PlanCode] = mapped_column(unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    price_monthly: Mapped[Numeric] = mapped_column(Numeric(8, 2), default=0, nullable=False)
    price_yearly: Mapped[Numeric] = mapped_column(Numeric(8, 2), default=0, nullable=False)

    resume_scan_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    text_interview_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    voice_interview_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    video_interview_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0 = disabled, None = unlimited
    report_history_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)

    roadmap_access: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    premium_resources: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    plan_id: Mapped[int] = mapped_column(ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False)

    status: Mapped[SubscriptionStatus] = mapped_column(default=SubscriptionStatus.ACTIVE, nullable=False)
    billing_cycle: Mapped[str] = mapped_column(String(10), default="month", nullable=False)  # month | year
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    renews_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    payment_provider: Mapped[str] = mapped_column(String(20), default="demo", nullable=False)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    stripe_checkout_session_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    provider_subscription_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    provider_order_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    plan = relationship("SubscriptionPlan")


class UsageRecord(Base):
    """One row per user per calendar month (period_month = first day of month)."""

    __tablename__ = "usage_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    period_month: Mapped[date] = mapped_column(Date, index=True, nullable=False)

    resume_scans_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    text_interviews_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    voice_interviews_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    video_interviews_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    subscription_id: Mapped[int | None] = mapped_column(ForeignKey("user_subscriptions.id", ondelete="SET NULL"), nullable=True)

    plan_name: Mapped[str] = mapped_column(String(60), nullable=False)
    amount: Mapped[Numeric] = mapped_column(Numeric(8, 2), nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(default=InvoiceStatus.PAID, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    stripe_event_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    provider_payment_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class PaymentOrder(Base, TimestampMixin):
    """A PayHere payment attempt. The historical class name is kept for compatibility."""
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    plan_id: Mapped[int] = mapped_column(ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False)
    plan_name: Mapped[str] = mapped_column(String(60), nullable=False)
    billing_cycle: Mapped[str] = mapped_column(String(10), nullable=False)
    amount: Mapped[Numeric] = mapped_column(Numeric(8, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    payment_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(60), nullable=True)
    provider_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    plan = relationship("SubscriptionPlan")
