import json


def build_interviewer_prompts(
    role: str,
    question_number: int,
    previous_turns: list[dict[str, str]],
) -> tuple[str, str]:
    """Build prompts for an adaptive, role-specific text interview."""

    if not role.strip():
        raise ValueError("Job role cannot be empty.")

    if not 1 <= question_number <= 6:
        raise ValueError("Question number must be between 1 and 6.")

    system_prompt = """
You are a professional job interviewer conducting a realistic interview.

Your responsibilities:
1. Interview the candidate for the selected job role.
2. Ask exactly ONE question at a time.
3. Make questions relevant to the selected role.
4. Start with a suitable opening question.
5. Adapt later questions based on previous answers.
6. Ask follow-up questions when an answer lacks detail.
7. Cover technical, behavioral, and situational topics.
8. Do not repeat previous questions.
9. Keep questions clear and professional.
10. Do not evaluate the candidate yet.

Return ONLY valid JSON in this exact format:
{
    "question": "The interview question",
    "question_type": "technical",
    "question_number": 1,
    "total_questions": 6
}

Rules:
- question_type must be technical, behavioral, or situational.
- question_number must match the current question number provided.
- total_questions must always be 6.
- Do not include Markdown or additional text.
"""

    previous_turns_json = json.dumps(
        previous_turns,
        ensure_ascii=False,
    )

    user_prompt = f"""
Conduct an interview for this job role:

{role.strip()}

Current question number: {question_number}
Maximum questions: 6

Previous interview questions and answers:
{previous_turns_json}

Generate the next appropriate question.
If this is question 1, introduce the interview.
If previous answers exist, use them to guide the next question.

Return exactly one question in the required JSON format.
Set question_number to {question_number} and total_questions to 6.
"""

    return system_prompt, user_prompt