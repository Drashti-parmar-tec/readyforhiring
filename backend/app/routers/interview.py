
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Interview, InterviewTurn, User
from app.schemas import (
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    InterviewFeedbackRequest,
    InterviewFeedbackResponse,
    InterviewStartRequest,
    InterviewStartResponse,
)
from app.services.feedback_service import (
    FeedbackServiceError,
    generate_interview_feedback,
)
from app.services.interview_service import (
    InterviewServiceError,
    generate_interview_question,
)

router = APIRouter(
    prefix="/api/interview",
    tags=["AI Interview"],
)

DB_DEPENDENCY = Depends(get_db)


@router.post(
    "/start",
    response_model=InterviewStartResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_interview(
    request: InterviewStartRequest,
    db: Session = DB_DEPENDENCY,
) -> InterviewStartResponse:
    """Create an interview and generate its first question."""

    try:
        user = db.get(User, request.user_id)

        if user is None:
            user = User(id=request.user_id, language="en")
            db.add(user)
            db.flush()

        interview = Interview(
            user_id=request.user_id,
            role=request.role.strip(),
            status="in_progress",
        )
        db.add(interview)
        db.flush()

        question = generate_interview_question(
            role=interview.role,
            question_number=1,
            previous_turns=[],
        )

        db.add(
            InterviewTurn(
                interview_id=interview.id,
                turn_number=1,
                question=question.question,
            )
        )

        db.commit()

        return InterviewStartResponse(
            interview_id=interview.id,
            question=question,
        )

    except InterviewServiceError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not start the interview. Please try again.",
        ) from exc


@router.post(
    "/answer",
    response_model=InterviewAnswerResponse,
    status_code=status.HTTP_200_OK,
)
def submit_interview_answer(
    request: InterviewAnswerRequest,
    db: Session = DB_DEPENDENCY,
) -> InterviewAnswerResponse:
    """Save an answer and generate the next interview question."""

    try:
        interview = db.get(Interview, request.interview_id)

        if interview is None or interview.user_id != request.user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found.",
            )

        if interview.status != "in_progress":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This interview is already completed.",
            )

        turns = db.scalars(
            select(InterviewTurn)
            .where(InterviewTurn.interview_id == interview.id)
            .order_by(InterviewTurn.turn_number)
        ).all()

        if not turns:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Interview has no questions.",
            )

        latest_turn = turns[-1]

        if latest_turn.answer is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This question has already been answered.",
            )

        latest_turn.answer = request.answer.strip()

        if len(turns) >= 6:
            interview.status = "awaiting_feedback"
            db.commit()

            return InterviewAnswerResponse(
                interview_id=interview.id,
                next_question=None,
                is_completed=True,
            )

        previous_turns = [
            {
                "question": turn.question,
                "answer": turn.answer or "",
            }
            for turn in turns
        ]

        next_question_number = len(turns) + 1

        question = generate_interview_question(
            role=interview.role,
            question_number=next_question_number,
            previous_turns=previous_turns,
        )

        db.add(
            InterviewTurn(
                interview_id=interview.id,
                turn_number=next_question_number,
                question=question.question,
            )
        )

        db.commit()

        return InterviewAnswerResponse(
            interview_id=interview.id,
            next_question=question,
            is_completed=False,
        )

    except HTTPException:
        db.rollback()
        raise

    except InterviewServiceError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not submit your answer. Please try again.",
        ) from exc


@router.post(
    "/feedback",
    response_model=InterviewFeedbackResponse,
    status_code=status.HTTP_200_OK,
)
def get_interview_feedback(
    request: InterviewFeedbackRequest,
    db: Session = DB_DEPENDENCY,
) -> InterviewFeedbackResponse:
    """Generate and save feedback for a completed interview."""

    try:
        interview = db.get(Interview, request.interview_id)

        if interview is None or interview.user_id != request.user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found.",
            )

        if interview.status not in ("awaiting_feedback", "completed"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Complete all six interview questions first.",
            )

        if interview.status == "completed" and interview.report_json:
            return InterviewFeedbackResponse.model_validate(
                {
                    **interview.report_json,
                    "interview_id": interview.id,
                }
            )

        turns = db.scalars(
            select(InterviewTurn)
            .where(InterviewTurn.interview_id == interview.id)
            .order_by(InterviewTurn.turn_number)
        ).all()

        if len(turns) != 6 or any(
            not turn.answer or not turn.answer.strip()
            for turn in turns
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="All six interview answers must be saved first.",
            )

        interview_data = [
            {
                "question": turn.question,
                "answer": turn.answer or "",
            }
            for turn in turns
        ]

        feedback = generate_interview_feedback(
            interview_id=interview.id,
            role=interview.role,
            interview_turns=interview_data,
        )

        interview.overall_score = feedback.overall_score
        interview.report_json = feedback.model_dump(
            mode="json",
            exclude={"interview_id"},
        )
        interview.status = "completed"

        db.commit()

        return feedback

    except HTTPException:
        db.rollback()
        raise

    except FeedbackServiceError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate interview feedback. Please try again.",
        ) from exc
