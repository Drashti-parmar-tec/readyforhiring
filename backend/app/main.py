from fastapi import FastAPI

app = FastAPI(
    title="ReadyForHiring API",
    description=(
        "An AI-powered career development and interview preparation platform."
    ),
    version="0.1.0",
)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """
    Check whether the ReadyForHiring backend is running.
    """
    return {"status": "ok"}
