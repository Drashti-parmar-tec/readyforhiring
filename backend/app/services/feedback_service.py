
import json

from groq import BadRequestError
from pydantic import ValidationError

from app.config import get_settings
from app.prompts.feedback import build_feedback_prompts
from app.schemas import InterviewFeedbackResponse
from app.services.groq_client import (
    call_with_rate_limit_retry,
    get_groq_client,
)

MAX_OUTPUT_RETRIES = 1


class FeedbackServiceError(Exception):
    """Raised when interview feedback cannot be generated."""


def generate_interview_feedback(
    interview_id,
    role: str,
    interview_turns: list[dict[str, str]],
) -> InterviewFeedbackResponse:
    """Generate and validate feedback for a completed interview."""

    settings = get_settings()

    if not settings.GROQ_MODEL_FAST:
        raise FeedbackServiceError("GROQ_MODEL_FAST is not configured.")

    system_prompt, user_prompt = build_feedback_prompts(
        role=role,
        interview_turns=interview_turns,
    )

    client = get_groq_client()
    last_error: Exception | None = None

    for attempt in range(MAX_OUTPUT_RETRIES + 1):
        current_user_prompt = user_prompt

        if attempt > 0:
            current_user_prompt += (
                "\n\nYour previous response was invalid. "
                "Return corrected JSON with an integer score, "
                "at least one strength, at least one improvement, "
                "and a specific summary."
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
                    max_completion_tokens=2000,
                    reasoning_effort="low",
                    include_reasoning=False,
                )
            )

            response_text = completion.choices[0].message.content

            if not response_text:
                raise ValueError("Groq returned an empty response.")

            feedback_data = json.loads(response_text)

            if not isinstance(feedback_data, dict):
                raise TypeError("Groq returned an invalid feedback format.")

            feedback_data["interview_id"] = str(interview_id)

            return InterviewFeedbackResponse.model_validate(
                feedback_data
            )

        except (ValidationError, ValueError, BadRequestError) as exc:
            last_error = exc

    raise FeedbackServiceError(
        "The AI could not generate valid interview feedback. Please try again."
    ) from last_error
