from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.services.interview_service import (
    InterviewServiceError,
    generate_interview_question,
    validate_interview_question,
)


def valid_response(
    question_number: int = 1,
    total_questions: int = 6,
) -> str:
    return (
        "{"
        '"question": "Tell me about a software project you worked on.",'
        '"question_type": "technical",'
        f'"question_number": {question_number},'
        f'"total_questions": {total_questions}'
        "}"
    )


def mock_groq_client(response_text: str | None = None):
    completion = SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(content=response_text)
            )
        ]
    )

    create = Mock(return_value=completion)

    client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(create=create)
        )
    )

    return client, create


def test_valid_interview_question():
    result = validate_interview_question(valid_response(), 1)

    assert result.question_number == 1
    assert result.total_questions == 6
    assert result.question_type == "technical"


def test_rejects_incorrect_question_number():
    with pytest.raises(ValueError, match="incorrect question number"):
        validate_interview_question(valid_response(2), 1)


def test_rejects_incorrect_total_questions():
    with pytest.raises(ValueError, match="incorrect total question count"):
        validate_interview_question(valid_response(1, 5), 1)


def test_rejects_malformed_json():
    with pytest.raises(ValueError):
        validate_interview_question("{invalid json}", 1)


def test_generates_question_with_groq(monkeypatch):
    client, create = mock_groq_client(valid_response())

    monkeypatch.setattr(
        "app.services.interview_service.get_settings",
        lambda: SimpleNamespace(GROQ_MODEL_FAST="test-model"),
    )
    monkeypatch.setattr(
        "app.services.interview_service.get_groq_client",
        lambda: client,
    )

    result = generate_interview_question(
        role="Software Developer",
        question_number=1,
        previous_turns=[],
    )

    assert result.question_number == 1
    assert result.total_questions == 6
    create.assert_called_once()


def test_retries_invalid_ai_response(monkeypatch):
    client, create = mock_groq_client()

    create.side_effect = [
        SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content=valid_response(2)
                    )
                )
            ]
        ),
        SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content=valid_response(1)
                    )
                )
            ]
        ),
    ]

    monkeypatch.setattr(
        "app.services.interview_service.get_settings",
        lambda: SimpleNamespace(GROQ_MODEL_FAST="test-model"),
    )
    monkeypatch.setattr(
        "app.services.interview_service.get_groq_client",
        lambda: client,
    )

    result = generate_interview_question(
        role="Software Developer",
        question_number=1,
        previous_turns=[],
    )

    assert result.question_number == 1
    assert create.call_count == 2


def test_fails_when_model_is_not_configured(monkeypatch):
    monkeypatch.setattr(
        "app.services.interview_service.get_settings",
        lambda: SimpleNamespace(GROQ_MODEL_FAST=""),
    )

    with pytest.raises(InterviewServiceError):
        generate_interview_question(
            role="Software Developer",
            question_number=1,
            previous_turns=[],
        )