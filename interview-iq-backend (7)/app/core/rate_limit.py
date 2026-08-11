import time
from collections import defaultdict, deque

from fastapi import Request

from app.config import settings
from app.core.exceptions import RateLimitError

# Minimal in-memory sliding-window limiter for development.
# Swap for Redis-backed slowapi limiting in production (multi-process safe).
_HITS: dict[str, deque] = defaultdict(deque)


def check_rate_limit(request: Request, key_prefix: str, max_requests: int = 20, window_seconds: int = 60) -> None:
    if not settings.RATE_LIMIT_ENABLED:
        return

    client_ip = request.client.host if request.client else "unknown"
    key = f"{key_prefix}:{client_ip}"
    now = time.time()
    window = _HITS[key]

    while window and window[0] < now - window_seconds:
        window.popleft()

    if len(window) >= max_requests:
        raise RateLimitError("Too many requests. Please slow down and try again shortly.")

    window.append(now)
