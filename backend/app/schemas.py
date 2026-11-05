from uuid import UUID

from pydantic import BaseModel, Field, model_validator


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
