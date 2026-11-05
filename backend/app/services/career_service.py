import json
from pathlib import Path
from typing import Any

from groq import BadRequestError
from pydantic import ValidationError

from app.config import get_settings
from app.prompts.career import build_career_prompts
from app.schemas import CareerDiscoverResponse
from app.services.groq_client import (
    call_with_rate_limit_retry,
    get_groq_client,
)

CAREER_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "careers.json"

MAX_OUTPUT_RETRIES = 1


class CareerServiceError(Exception):
    """Raised when career recommendations cannot be generated."""


def load_career_catalog() -> dict[str, Any]:
    """Load and validate the available career records."""

    try:
        with CAREER_DATA_PATH.open(encoding="utf-8") as file:
            catalog = json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        raise CareerServiceError("The career catalog could not be loaded.") from exc

    if not isinstance(catalog, dict):
        raise CareerServiceError("The career catalog has an invalid format.")

    careers = catalog.get("careers")

    if not isinstance(careers, list) or not careers:
        raise CareerServiceError("The career catalog contains no careers.")

    career_ids = [career.get("id") for career in careers if isinstance(career, dict)]

    if len(career_ids) != len(careers):
        raise CareerServiceError(
            "The career catalog contains an invalid career record."
        )

    if any(not isinstance(career_id, str) or not career_id for career_id in career_ids):
        raise CareerServiceError("The career catalog contains an invalid career ID.")

    if len(career_ids) != len(set(career_ids)):
        raise CareerServiceError("The career catalog contains duplicate career IDs.")

    return catalog


def validate_recommendations(
    response_text: str,
    valid_career_ids: set[str],
) -> CareerDiscoverResponse:
    """Parse and validate the AI response and career IDs."""

    result = CareerDiscoverResponse.model_validate_json(response_text)

    for recommendation in result.recommendations:
        if recommendation.career_id not in valid_career_ids:
            raise ValueError(f"Unknown career ID: {recommendation.career_id}")

    return result


def discover_careers(
    interests: list[str],
    skills: list[str],
) -> CareerDiscoverResponse:
    """Generate and validate career recommendations using Groq."""

    settings = get_settings()

    if not settings.GROQ_MODEL_FAST:
        raise CareerServiceError("GROQ_MODEL_FAST is not configured.")

    catalog = load_career_catalog()
    valid_career_ids = {career["id"] for career in catalog["careers"]}

    system_prompt, user_prompt = build_career_prompts(
        interests=interests,
        skills=skills,
        career_catalog=catalog,
    )

    client = get_groq_client()
    last_error: Exception | None = None

    for attempt in range(MAX_OUTPUT_RETRIES + 1):
        current_user_prompt = user_prompt

        if attempt > 0:
            current_user_prompt += (
                "\n\nYour previous response was invalid. "
                "Return corrected JSON that follows the exact "
                "required structure and uses only valid career IDs."
            )

        try:
            completion = call_with_rate_limit_retry(
                lambda prompt=current_user_prompt: client.chat.completions.create(
                    model=settings.GROQ_MODEL_FAST,
                    messages=[
                        {
                            "role": "system",
                            "content": system_prompt,
                        },
                        {
                            "role": "user",
                            "content": prompt,
                        },
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_completion_tokens=3000,
                    reasoning_effort="low",
                    include_reasoning=False,
                )
            )

            response_text = completion.choices[0].message.content

            if not response_text:
                raise ValueError("Groq returned an empty response.")

            return validate_recommendations(
                response_text=response_text,
                valid_career_ids=valid_career_ids,
            )

        except (ValidationError, ValueError, BadRequestError) as exc:
            last_error = exc

    raise CareerServiceError(
        "The AI could not generate a valid career recommendation. Please try again."
    ) from last_error
