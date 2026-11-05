from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import CareerResult, User
from app.schemas import (
    CareerDiscoverRequest,
    CareerDiscoverResponse,
)
from app.services.career_service import (
    CareerServiceError,
    discover_careers,
)

router = APIRouter(
    prefix="/api/career",
    tags=["Career Discovery"],
)

DB_DEPENDENCY = Depends(get_db)


@router.post(
    "/discover",
    response_model=CareerDiscoverResponse,
    status_code=status.HTTP_200_OK,
)
def career_discovery(
    request: CareerDiscoverRequest,
    db: Session = DB_DEPENDENCY,
) -> CareerDiscoverResponse:
    """Generate career recommendations and save them to Neon."""

    try:
        recommendations = discover_careers(
            interests=request.interests,
            skills=request.skills,
        )

        user = db.get(User, request.user_id)

        if user is None:
            user = User(id=request.user_id, language="en")
            db.add(user)
            db.flush()

        career_result = CareerResult(
            user_id=request.user_id,
            input_json={
                "interests": request.interests,
                "skills": request.skills,
            },
            result_json=recommendations.model_dump(mode="json"),
        )

        db.add(career_result)
        db.commit()

        return recommendations

    except CareerServiceError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Career discovery failed. Please try again.",
        ) from exc
