
from fastapi.testclient import TestClient

from app.main import app
from app.routers.interview import MAX_AUDIO_SIZE

client = TestClient(app)


def test_transcribe_audio_returns_text(monkeypatch):
    def mock_transcribe_audio(audio_data: bytes, filename: str) -> str:
        assert audio_data == b"fake audio data"
        assert filename == "recording.webm"
        return "Tell me about yourself."

    monkeypatch.setattr(
        "app.routers.interview.transcribe_audio",
        mock_transcribe_audio,
    )

    response = client.post(
        "/api/interview/transcribe",
        files={
            "audio": (
                "recording.webm",
                b"fake audio data",
                "audio/webm",
            )
        },
    )

    assert response.status_code == 200
    assert response.json() == {"text": "Tell me about yourself."}


def test_transcribe_audio_rejects_non_audio_file():
    response = client.post(
        "/api/interview/transcribe",
        files={
            "audio": (
                "document.txt",
                b"some text",
                "text/plain",
            )
        },
    )

    assert response.status_code == 415


def test_transcribe_audio_rejects_empty_file():
    response = client.post(
        "/api/interview/transcribe",
        files={
            "audio": (
                "empty.webm",
                b"",
                "audio/webm",
            )
        },
    )

    assert response.status_code == 400


def test_transcribe_audio_rejects_files_over_10_mb():
    response = client.post(
        "/api/interview/transcribe",
        files={
            "audio": (
                "large.webm",
                b"a" * (MAX_AUDIO_SIZE + 1),
                "audio/webm",
            )
        },
    )

    assert response.status_code == 413


def test_transcribe_audio_handles_service_error(monkeypatch):
    from app.routers.interview import TranscriptionServiceError

    def mock_transcribe_audio(audio_data: bytes, filename: str) -> str:
        raise TranscriptionServiceError("Transcription failed.")

    monkeypatch.setattr(
        "app.routers.interview.transcribe_audio",
        mock_transcribe_audio,
    )

    response = client.post(
        "/api/interview/transcribe",
        files={
            "audio": (
                "recording.webm",
                b"fake audio data",
                "audio/webm",
            )
        },
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Transcription failed."
