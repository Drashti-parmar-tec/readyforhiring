
from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

import pytest

from app.services.feedback_service import (
    FeedbackServiceError,
    generate_interview_feedback,
)

INTERVIEW_ID = uuid4()


def valid_feedback_response() -> str:
    return """
    {
        "overall_score": 78,
        "strengths": [
            "Demonstrates understanding of REST APIs",
            "Explains basic testing practices"
        ],
        "improvements": [
            "Provide more specific technical examples",
            "Explain production security in greater detail"
        ],
        "summary": "The candidate demonstrates a good foundation in backend development but needs more detailed practical explanations."
    }
    """


def mock_groq_client(responses: list[str | None]):
    completions = [
        SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content=response)
                )
            ]
        )
        for response in responses
    ]

    create = Mock(side_effect=completions)

    client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(create=create)
        )
    )

    return client, create


def sample_turns() -> list[dict[str, str]]:
    return [
        {
            "question": f"Interview question {number}",
            "answer": f"Candidate answer {number}",
        }
        for number in range(1, 7)
    ]


def test_generates_valid_feedback(monkeypatch):
    client, create = mock_groq_client(
        [valid_feedback_response()]
    )

    monkeypatch.setattr(
        "app.services.feedback_service.get_settings",
        lambda: SimpleNamespace(GROQ_MODEL_FAST="test-model"),
    )
    monkeypatch.setattr(
        "app.services.feedback_service.get_groq_client",
        lambda: client,
    )

    result = generate_interview_feedback(
        interview_id=INTERVIEW_ID,
        role="Software Developer",
        interview_turns=sample_turns(),
    )

    assert result.interview_id == INTERVIEW_ID
    assert result.overall_score == 78
    assert len(result.strengths) >= 1
    assert len(result.improvements) >= 1
    create.assert_called_once()


def test_rejects_invalid_feedback_and_retries(monkeypatch):
    client, create = mock_groq_client(
        [
            '{"overall_score": 150}',
            valid_feedback_response(),
        ]
    )

    monkeypatch.setattr(
        "app.services.feedback_service.get_settings",
        lambda: SimpleNamespace(GROQ_MODEL_FAST="test-model"),
    )
    monkeypatch.setattr(
        "app.services.feedback_service.get_groq_client",
        lambda: client,
    )

    result = generate_interview_feedback(
        interview_id=INTERVIEW_ID,
        role="Software Developer",
        interview_turns=sample_turns(),
    )

    assert result.overall_score == 78
    assert create.call_count == 2


def test_fails_after_invalid_feedback_retry(monkeypatch):
    client, create = mock_groq_client(
        [
            '{"overall_score": 150}',
            '{"overall_score": 150}',
        ]
    )

    monkeypatch.setattr(
        "app.services.feedback_service.get_settings",
        lambda: SimpleNamespace(GROQ_MODEL_FAST="test-model"),
    )
    monkeypatch.setattr(
        "app.services.feedback_service.get_groq_client",
        lambda: client,
    )

    with pytest.raises(FeedbackServiceError):
        generate_interview_feedback(
            interview_id=INTERVIEW_ID,
            role="Software Developer",
            interview_turns=sample_turns(),
        )

    assert create.call_count == 2


def test_fails_when_model_is_not_configured(monkeypatch):
    monkeypatch.setattr(
        "app.services.feedback_service.get_settings",
        lambda: SimpleNamespace(GROQ_MODEL_FAST=""),
    )

    with pytest.raises(FeedbackServiceError):
        generate_interview_feedback(
            interview_id=INTERVIEW_ID,
            role="Software Developer",
            interview_turns=sample_turns(),
        )


def test_rejects_incomplete_interview():
    with pytest.raises(ValueError, match="six interview turns"):
        generate_interview_feedback(
            interview_id=INTERVIEW_ID,
            role="Software Developer",
            interview_turns=sample_turns()[:3],
        )
