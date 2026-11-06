from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401
from app.config import get_settings
from app.db import Base, engine
from app.routers.career import router as career_router
from app.routers.interview import router as interview_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables when the application starts."""
    Base.metadata.create_all(bind=engine)
    yield


settings = get_settings()

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

if settings.FRONTEND_URL:
    allowed_origins.append(settings.FRONTEND_URL.rstrip("/"))


app = FastAPI(
    title="ReadyForHiring API",
    description=(
        "An AI-powered career development and interview preparation platform."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(career_router)
app.include_router(interview_router)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Check whether the ReadyForHiring backend is running."""
    return {"status": "ok"}