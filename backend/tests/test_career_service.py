import json
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.services.career_service import (
    CareerServiceError,
    discover_careers,
    load_career_catalog,
    validate_recommendations,
)


def test_career_catalog_contains_eight_careers():
    catalog = load_career_catalog()

    assert len(catalog["careers"]) == 8
    assert all(career.get("id") for career in catalog["careers"])


def test_valid_career_recommendation_is_accepted():
    catalog = load_career_catalog()
    valid_ids = {career["id"] for career in catalog["careers"]}

    response = {
        "recommendations": [
            {
                "career_id": next(iter(valid_ids)),
                "match_score": 85,
                "reason": "Matches the user's interests and skills.",
                "matching_skills": ["Python"],
                "skill_gaps": ["SQL"],
                "next_steps": ["Learn SQL fundamentals"],
            }
        ]
    }

    result = validate_recommendations(
        response_text=json.dumps(response),
        valid_career_ids=valid_ids,
    )

    assert len(result.recommendations) == 1
    assert result.recommendations[0].match_score == 85


def test_unknown_career_id_is_rejected():
    response = {
        "recommendations": [
            {
                "career_id": "unknown-career",
                "match_score": 85,
                "reason": "Test recommendation.",
                "matching_skills": [],
                "skill_gaps": [],
                "next_steps": ["Research this career"],
            }
        ]
    }

    with pytest.raises(ValueError, match="Unknown career ID"):
        validate_recommendations(
            response_text=json.dumps(response),
            valid_career_ids={"software-developer"},
        )


def test_malformed_json_is_rejected():
    with pytest.raises(ValidationError):
        validate_recommendations(
            response_text="This is not valid JSON",
            valid_career_ids={"software-developer"},
        )


def test_discover_careers_retries_invalid_ai_response(monkeypatch):
    from app.services import career_service

    valid_career_id = load_career_catalog()["careers"][0]["id"]

    valid_response = {
        "recommendations": [
            {
                "career_id": valid_career_id,
                "match_score": 85,
                "reason": "Matches the user's interests and skills.",
                "matching_skills": ["Python"],
                "skill_gaps": ["SQL"],
                "next_steps": ["Learn SQL fundamentals"],
            }
        ]
    }

    responses = [
        SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content="Invalid JSON response")
                )
            ]
        ),
        SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content=json.dumps(valid_response))
                )
            ]
        ),
    ]

    class FakeCompletions:
        def create(self, **kwargs):
            assert kwargs["response_format"] == {"type": "json_object"}
            return responses.pop(0)

    fake_client = SimpleNamespace(chat=SimpleNamespace(completions=FakeCompletions()))

    monkeypatch.setattr(
        career_service,
        "get_groq_client",
        lambda: fake_client,
    )

    monkeypatch.setattr(
        career_service,
        "call_with_rate_limit_retry",
        lambda operation: operation(),
    )

    monkeypatch.setattr(
        career_service,
        "build_career_prompts",
        lambda **kwargs: ("system prompt", "user prompt"),
    )

    result = discover_careers(
        interests=["Technology"],
        skills=["Python"],
    )

    assert len(result.recommendations) == 1
    assert result.recommendations[0].career_id == valid_career_id
    assert len(responses) == 0


def test_discover_careers_fails_after_retry_if_response_stays_invalid(
    monkeypatch,
):
    from app.services import career_service

    class FakeCompletions:
        def create(self, **kwargs):
            return SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        message=SimpleNamespace(content="Invalid JSON response")
                    )
                ]
            )

    fake_client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(create=FakeCompletions().create)
        )
    )

    monkeypatch.setattr(
        career_service,
        "get_groq_client",
        lambda: fake_client,
    )

    monkeypatch.setattr(
        career_service,
        "call_with_rate_limit_retry",
        lambda operation: operation(),
    )

    monkeypatch.setattr(
        career_service,
        "build_career_prompts",
        lambda **kwargs: ("system prompt", "user prompt"),
    )

    with pytest.raises(
        CareerServiceError,
        match="could not generate a valid career recommendation",
    ):
        discover_careers(
            interests=["Technology"],
            skills=["Python"],
        )
