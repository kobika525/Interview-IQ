from datetime import date, datetime, timezone


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def utcnow_naive() -> datetime:
    """Naive UTC 'now', for direct comparison against datetimes read back
    from MySQL (which always come back naive — see strip_tz)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def current_period_key() -> date:
    """First day of the current month — used as the UsageRecord period key."""
    today = utcnow().date()
    return today.replace(day=1)


def strip_tz(value: datetime) -> datetime:
    """MySQL's DATETIME columns don't preserve timezone info — PyMySQL always
    returns naive datetimes on read, even when the SQLAlchemy column declares
    timezone=True. Freshly-constructed Python datetimes from utcnow() are
    timezone-aware, so mixing the two in arithmetic raises a TypeError. This
    normalizes both sides to naive UTC before any subtraction/comparison."""
    return value.replace(tzinfo=None) if value.tzinfo is not None else value


def days_between(start: datetime, end: datetime) -> int:
    return (strip_tz(end) - strip_tz(start)).days
