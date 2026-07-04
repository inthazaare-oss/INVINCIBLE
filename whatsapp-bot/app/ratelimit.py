from __future__ import annotations

import time
from collections import defaultdict, deque

from .config import settings

# In-memory sliding window, keyed per WhatsApp number. Cheap and correct for a
# single-process deployment because every access happens inside one asyncio
# event loop with no `await` in between (so it can't interleave). Running
# multiple replicas/workers needs a shared store (e.g. Redis) instead.
_hits: dict[str, deque[float]] = defaultdict(deque)


def is_rate_limited(phone_number: str) -> bool:
    now = time.monotonic()
    window = settings.rate_limit_window_seconds
    hits = _hits[phone_number]

    while hits and now - hits[0] > window:
        hits.popleft()

    if len(hits) >= settings.rate_limit_max_messages:
        return True

    hits.append(now)
    return False
