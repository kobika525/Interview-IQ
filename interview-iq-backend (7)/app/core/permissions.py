from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, UsageLimitError
from app.models.subscription import UserSubscription, UsageRecord, SubscriptionPlan
from app.models.user import User
from app.utils.enums import SubscriptionStatus
from app.utils.datetime import current_period_key


def require_admin(user: User) -> None:
    if user.role.value != "ADMIN":
        raise ForbiddenError("Admin privileges are required for this action.")


def require_active_account(user: User) -> None:
    if user.account_status.value != "ACTIVE":
        raise ForbiddenError("Your account is not active. Please contact support.")


def get_active_plan(db: Session, user_id: int) -> SubscriptionPlan:
    sub = (
        db.query(UserSubscription)
        .filter(UserSubscription.user_id == user_id, UserSubscription.status == SubscriptionStatus.ACTIVE)
        .order_by(UserSubscription.created_at.desc())
        .first()
    )
    if sub and sub.plan:
        return sub.plan
    return db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "FREE").first()


def require_plan_feature(db: Session, user_id: int, feature: str) -> None:
    plan = get_active_plan(db, user_id)
    feature_flags = {
        "video_interview": plan.video_interview_limit != 0,
        "roadmap_access": plan.roadmap_access,
        "premium_resources": plan.premium_resources,
    }
    if not feature_flags.get(feature, True):
        raise UsageLimitError(f"The '{feature}' feature requires a plan upgrade.")


def _get_or_create_usage_record(db: Session, user_id: int) -> UsageRecord:
    period = current_period_key()
    record = (
        db.query(UsageRecord)
        .filter(UsageRecord.user_id == user_id, UsageRecord.period_month == period)
        .first()
    )
    if not record:
        record = UsageRecord(user_id=user_id, period_month=period)
        db.add(record)
        db.flush()
    return record


USAGE_FIELD_BY_KEY = {
    "resume_scan": "resume_scans_used",
    "text_interview": "text_interviews_used",
    "voice_interview": "voice_interviews_used",
    "video_interview": "video_interviews_used",
}

LIMIT_FIELD_BY_KEY = {
    "resume_scan": "resume_scan_limit",
    "text_interview": "text_interview_limit",
    "voice_interview": "voice_interview_limit",
    "video_interview": "video_interview_limit",
}


def enforce_usage_limit(db: Session, user_id: int, usage_key: str) -> None:
    """Raises UsageLimitError if the user has exhausted this month's quota. None = unlimited."""
    plan = get_active_plan(db, user_id)
    limit = getattr(plan, LIMIT_FIELD_BY_KEY[usage_key])
    if limit is None:
        return
    record = _get_or_create_usage_record(db, user_id)
    used = getattr(record, USAGE_FIELD_BY_KEY[usage_key])
    if used >= limit:
        raise UsageLimitError(f"You've used all {limit} of your plan's monthly {usage_key.replace('_', ' ')}s.")


def increment_usage(db: Session, user_id: int, usage_key: str, amount: int = 1) -> UsageRecord:
    record = _get_or_create_usage_record(db, user_id)
    field = USAGE_FIELD_BY_KEY[usage_key]
    setattr(record, field, getattr(record, field) + amount)
    db.flush()
    return record


def require_ownership(resource_owner_id: int, user: User) -> None:
    if resource_owner_id != user.id and user.role.value != "ADMIN":
        raise ForbiddenError("You don't have access to this resource.")
