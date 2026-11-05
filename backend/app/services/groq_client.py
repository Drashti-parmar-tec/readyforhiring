import time
from collections.abc import Callable
from functools import lru_cache

from groq import Groq, RateLimitError

from app.config import get_settings

MAX_RETRIES = 1


@lru_cache
def get_groq_client() -> Groq:
    """
    Create and reuse a Groq API client.
    """
    settings = get_settings()

    return Groq(
        api_key=settings.GROQ_API_KEY.get_secret_value(),
        max_retries=0,
    )


def call_with_rate_limit_retry[T](operation: Callable[[], T]) -> T:
    """
    Retry a Groq operation once if the rate limit is reached.
    """
    for attempt in range(MAX_RETRIES + 1):
        try:
            return operation()

        except RateLimitError:
            if attempt == MAX_RETRIES:
                raise

            time.sleep(2)

    raise RuntimeError("Groq operation failed unexpectedly.")
