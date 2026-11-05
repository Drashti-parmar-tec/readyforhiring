import httpx
from groq import RateLimitError

from app.services.groq_client import call_with_rate_limit_retry


def test_rate_limit_retries_once(monkeypatch):
    attempts = {"count": 0}

    def fake_sleep(seconds):
        assert seconds == 2

    monkeypatch.setattr(
        "app.services.groq_client.time.sleep",
        fake_sleep,
    )

    def fake_operation():
        attempts["count"] += 1

        if attempts["count"] == 1:
            raise RateLimitError(
                "Simulated rate limit",
                response=httpx.Response(
                    429,
                    request=httpx.Request(
                        "POST",
                        "https://example.com",
                    ),
                ),
                body=None,
            )

        return "Success"

    result = call_with_rate_limit_retry(fake_operation)

    assert result == "Success"
    assert attempts["count"] == 2
