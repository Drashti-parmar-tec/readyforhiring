
import json


def build_feedback_prompts(
    role: str,
    interview_turns: list[dict[str, str]],
) -> tuple[str, str]:
    """Build prompts for evaluating a completed job interview."""

    if not role.strip():
        raise ValueError("Job role cannot be empty.")

    if len(interview_turns) != 6:
        raise ValueError("Exactly six interview turns are required.")

    if any(
        not turn.get("question", "").strip()
        or not turn.get("answer", "").strip()
        for turn in interview_turns
    ):
        raise ValueError("Every interview question must have an answer.")

    system_prompt = """
You are an experienced technical interviewer and career coach.

Evaluate the candidate's interview answers for the selected job role.

Evaluate these areas:
1. Technical knowledge and accuracy.
2. Problem-solving ability.
3. Communication and clarity.
4. Practical understanding.
5. Completeness and relevance of answers.

Scoring rules:
- Give an overall score between 0 and 100.
- Base the score on the actual answers provided.
- Do not reward technologies or experience the candidate did not demonstrate.
- Be fair, specific, and constructive.
- Do not invent candidate experience.
- Explain weaknesses honestly.
- Give actionable improvements.

Return ONLY valid JSON in this exact format:
{
    "overall_score": 75,
    "strengths": [
        "Example strength"
    ],
    "improvements": [
        "Example improvement"
    ],
    "summary": "A concise evaluation of the candidate's performance."
}

Rules:
- overall_score must be an integer between 0 and 100.
- strengths must contain at least one item.
- improvements must contain at least one item.
- summary must be specific to the candidate's answers.
- Do not include Markdown or additional text.
"""

    interview_json = json.dumps(
        interview_turns,
        ensure_ascii=False,
    )

    user_prompt = f"""
Evaluate this completed job interview.

Job role:
{role.strip()}

Interview questions and candidate answers:
{interview_json}

Evaluate the candidate based only on the supplied conversation.

Return the feedback in the exact required JSON format.
"""

    return system_prompt, user_prompt
