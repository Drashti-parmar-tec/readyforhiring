from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GROQ_API_KEY: SecretStr

    GROQ_MODEL_CHAT: str = ""
    GROQ_MODEL_FAST: str = ""
    GROQ_MODEL_STT: str = ""

    DATABASE_URL: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
