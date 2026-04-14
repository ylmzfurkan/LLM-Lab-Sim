from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings


def _enabled_key(request) -> str:
    return get_remote_address(request)


limiter = Limiter(
    key_func=_enabled_key,
    enabled=settings.rate_limit_enabled,
    default_limits=[],
)
