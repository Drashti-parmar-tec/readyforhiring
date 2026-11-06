
from app.config import get_settings
from app.services.groq_client import (
    call_with_rate_limit_retry,
    get_groq_client,
)


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
        raise TranscriptionServiceError(
            "Speech-to-text is not configured on the server."
        )

    client = get_groq_client()

    try:
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

    except Exception as exc:
        raise TranscriptionServiceError(
            "Could not transcribe the audio. Please try again."
        ) from exc
