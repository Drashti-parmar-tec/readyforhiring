from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import models  # noqa: F401
from app.db import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Create database tables when the application starts.
    """
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="ReadyForHiring API",
    description=(
        "An AI-powered career development and interview preparation platform."
    ),
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """
    Check whether the ReadyForHiring backend is running.
    """
    return {"status": "ok"}
