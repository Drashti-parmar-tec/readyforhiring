from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


def get_database_url() -> str:
    """
    Read and prepare the Neon PostgreSQL connection URL.
    """
    database_url = get_settings().DATABASE_URL

    if not database_url:
        raise RuntimeError("DATABASE_URL is missing. Add it to backend/.env.")

    url = make_url(database_url)

    # Use psycopg 3, which is installed in this project.
    if url.drivername in ("postgresql", "postgres"):
        url = url.set(drivername="postgresql+psycopg")

    return url.render_as_string(hide_password=False)


engine = create_engine(
    get_database_url(),
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy database models.
    """


def get_db() -> Generator[Session, None, None]:
    """
    Provide a database session and close it after use.
    """
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
