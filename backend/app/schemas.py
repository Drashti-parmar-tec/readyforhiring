
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

# -----------------------------------------
# Career Discovery schemas
# -----------------------------------------

class CareerDiscoverRequest(BaseModel):
    """Validate the user's career discovery input."""

    user_id: UUID
    interests: list[str] = Field(default_factory=list, max_length=20)
    skills: list[str] = Field(default_factory=list, max_length=30)

    @model_validator(mode="after")
    def validate_profile(self):
        if not self.interests and not self.skills:
            raise ValueError("Provide at least one interest or skill.")

        return self


class CareerRecommendation(BaseModel):
    """Validate one AI-generated career recommendation."""

    career_id: str = Field(min_length=1)
    match_score: int = Field(ge=0, le=100)
    reason: str = Field(min_length=1)
    matching_skills: list[str]
    skill_gaps: list[str]
    next_steps: list[str] = Field(min_length=1)


class CareerDiscoverResponse(BaseModel):
    """Validate the complete career discovery result."""

    recommendations: list[CareerRecommendation] = Field(max_length=5)


# -----------------------------------------
# AI Interview schemas
# -----------------------------------------

class InterviewStartRequest(BaseModel):
    """Validate a request to start a text interview."""

    user_id: UUID
    role: str = Field(min_length=2, max_length=100)


class InterviewAnswerRequest(BaseModel):
    """Validate a candidate's answer during an interview."""

    user_id: UUID
    interview_id: UUID
    answer: str = Field(min_length=1, max_length=5000)


class InterviewQuestionResponse(BaseModel):
    """Validate one AI-generated interview question."""

    question: str = Field(min_length=1, max_length=2000)
    question_type: str = Field(
        pattern="^(technical|behavioral|situational)$"
    )
    question_number: int = Field(ge=1, le=6)
    total_questions: int = Field(default=6, ge=1, le=6)

class InterviewStartResponse(BaseModel):
    """Return the interview ID and its first question."""

    interview_id: UUID
    question: InterviewQuestionResponse

class InterviewAnswerResponse(BaseModel):
    """Validate the response after submitting an interview answer."""

    interview_id: UUID
    next_question: InterviewQuestionResponse | None = None
    is_completed: bool = False


class InterviewFeedbackRequest(BaseModel):
    """Validate a request to generate interview feedback."""

    user_id: UUID
    interview_id: UUID

class InterviewFeedbackResponse(BaseModel):
    """Validate the final interview feedback."""

    interview_id: UUID
    overall_score: int = Field(ge=0, le=100)
    strengths: list[str]
    improvements: list[str]
    summary: str = Field(min_length=1, max_length=3000)
