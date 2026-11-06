
import logging

from app.config import get_settings
from app.services.groq_client import (
    call_with_rate_limit_retry,
    get_groq_client,
)

logger = logging.getLogger(__name__)


class TranscriptionServiceError(Exception):
    """Raised when audio transcription fails."""


def transcribe_audio(
    audio_data: bytes,
    filename: str,
) -> str:
    """
    Convert uploaded audio into text using Groq Whisper.
    """

    if not audio_data:
        raise TranscriptionServiceError(
            "The uploaded audio file is empty."
        )

    settings = get_settings()
    model = settings.GROQ_MODEL_STT.strip()

    if not model:
        logger.error(
            "Speech-to-text is not configured on the server."
        )
        raise TranscriptionServiceError(
            "Speech-to-text is not configured on the server."
        )

    try:
        client = get_groq_client()

        result = call_with_rate_limit_retry(
            lambda: client.audio.transcriptions.create(
                file=(filename, audio_data),
                model=model,
                response_format="json",
            )
        )

        transcription = result.text.strip()

        if not transcription:
            raise TranscriptionServiceError(
                "No speech could be detected in the audio."
            )

        return transcription

    except TranscriptionServiceError:
        raise

    except Exception:
        logger.exception(
            "Groq audio transcription failed. Model: %s",
            model,
        )
        raise TranscriptionServiceError(
            "Could not transcribe the audio. Please try again."
        ) from None
