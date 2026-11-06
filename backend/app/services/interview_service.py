
from groq import BadRequestError
from pydantic import ValidationError

from app.config import get_settings
from app.prompts.interviewer import build_interviewer_prompts
from app.schemas import InterviewQuestionResponse
from app.services.groq_client import (
    call_with_rate_limit_retry,
    get_groq_client,
)

MAX_OUTPUT_RETRIES = 1


class InterviewServiceError(Exception):
    """Raised when an interview question cannot be generated."""


def validate_interview_question(
    response_text: str,
    question_number: int,
) -> InterviewQuestionResponse:
    """Parse and validate one AI-generated interview question."""

    result = InterviewQuestionResponse.model_validate_json(response_text)

    if result.question_number != question_number:
        raise ValueError("AI returned an incorrect question number.")

    if result.total_questions != 6:
        raise ValueError("AI returned an incorrect total question count.")

    return result


def generate_interview_question(
    role: str,
    question_number: int,
    previous_turns: list[dict[str, str]],
) -> InterviewQuestionResponse:
    """Generate and validate an interview question using Groq."""

    settings = get_settings()

    if not settings.GROQ_MODEL_FAST:
        raise InterviewServiceError("GROQ_MODEL_FAST is not configured.")

    system_prompt, user_prompt = build_interviewer_prompts(
        role=role,
        question_number=question_number,
        previous_turns=previous_turns,
    )

    client = get_groq_client()
    last_error: Exception | None = None

    for attempt in range(MAX_OUTPUT_RETRIES + 1):
        current_user_prompt = user_prompt

        if attempt > 0:
            current_user_prompt += (
                "\n\nYour previous response was invalid. "
                "Return corrected JSON with the exact required "
                "fields, question number, and total question count."
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
                    max_completion_tokens=1000,
                    reasoning_effort="low",
                    include_reasoning=False,
                )
            )

            response_text = completion.choices[0].message.content

            if not response_text:
                raise ValueError("Groq returned an empty response.")

            return validate_interview_question(
                response_text=response_text,
                question_number=question_number,
            )

        except (ValidationError, ValueError, BadRequestError) as exc:
            last_error = exc

    raise InterviewServiceError(
        "The AI could not generate a valid interview question. Please try again."
    ) from last_error
