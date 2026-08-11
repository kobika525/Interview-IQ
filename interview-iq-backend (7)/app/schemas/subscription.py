from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class PlanOut(ORMModel):
    id: int
    code: str
    name: str
    price_monthly: float
    price_yearly: float
    resume_scan_limit: int | None
    text_interview_limit: int | None
    voice_interview_limit: int | None
    video_interview_limit: int | None
    report_history_limit: int | None
    roadmap_access: bool
    premium_resources: bool


class CurrentSubscriptionOut(BaseModel):
    plan: PlanOut
    status: str
    billing_cycle: str
    renews_at: datetime | None
    cancelled_at: datetime | None


class UsageOut(BaseModel):
    period_month: str
    resume_scans_used: int
    resume_scan_limit: int | None
    text_interviews_used: int
    text_interview_limit: int | None
    voice_interviews_used: int
    voice_interview_limit: int | None
    video_interviews_used: int
    video_interview_limit: int | None


class DemoUpgradeRequest(BaseModel):
    plan_code: str
    billing_cycle: str = "month"


class CheckoutSessionRequest(BaseModel):
    plan_code: str
    billing_cycle: str = "month"


class CheckoutSessionOut(BaseModel):
    session_id: str
    checkout_url: str


class CheckoutStatusOut(BaseModel):
    session_id: str
    payment_status: str
    subscription_active: bool


class PayHereCheckoutRequest(CheckoutSessionRequest):
    phone: str
    address: str
    city: str


class InvoiceOut(ORMModel):
    id: int
    plan_name: str
    amount: float
    status: str
    is_demo: bool
    issued_at: datetime


class PaymentOut(ORMModel):
    id: int
    order_id: str
    plan_name: str
    amount: float
    currency: str
    payment_id: str | None
    payment_method: str | None
    status: str
    created_at: datetime
    updated_at: datetime
