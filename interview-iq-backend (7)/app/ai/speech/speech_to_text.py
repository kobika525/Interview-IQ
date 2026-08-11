"""Gemini-backed official transcription and delivery-quality analysis."""

import json
import logging
import mimetypes
import os
import time

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.config import settings
from app.ai.llm.gemini_client import create_client

logger = logging.getLogger("app.ai.speech")


class GeminiVoiceResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    transcript: str = Field(min_length=1, max_length=50000)
    detected_language: str | None = Field(default=None, max_length=80)
    confidence_level: float = Field(ge=0, le=100)
    fluency: float = Field(ge=0, le=100)
    pronunciation_quality: float = Field(ge=0, le=100)
    voice_clarity: float = Field(ge=0, le=100)


def transcribe_audio(file_path: str, model_size: str = "base") -> dict:
    """Create the official transcript with Gemini.

    ``model_size`` remains accepted for backward compatibility but is ignored.
    No browser transcript or local Whisper result can become the official text.
    """
    del model_size
    if not settings.GEMINI_API_KEY:
        return _unavailable("Gemini transcription is not configured.")

    uploaded = None
    client = None
    normalized_path = None
    try:
        from google.genai import types

        media_path = file_path
        if os.path.splitext(file_path)[1].lower() != ".wav":
            # Gemini media processing is inconsistent with browser-recorded
            # WebM/Opus containers. Normalize them to a PCM WAV before upload.
            from app.ai.video.audio_extractor import extract_audio_track

            normalized_path = extract_audio_track(file_path)
            media_path = normalized_path

        client = create_client(timeout=120)
        mime_type = mimetypes.guess_type(media_path)[0] or "audio/wav"
        uploaded = client.files.upload(file=media_path, config={"mime_type": mime_type})

        deadline = time.monotonic() + 90
        while getattr(getattr(uploaded, "state", None), "name", "") == "PROCESSING":
            if time.monotonic() >= deadline:
                raise TimeoutError("Gemini media processing timed out.")
            time.sleep(2)
            uploaded = client.files.get(name=uploaded.name)
        if getattr(getattr(uploaded, "state", None), "name", "") == "FAILED":
            raise RuntimeError("Gemini could not process the recording.")

        prompt = """Transcribe every intelligible spoken word in this interview recording accurately.
Do not summarize, correct, or improve the candidate's wording. Preserve filler words such as um, uh,
like, actually, basically, and you know because they are required for delivery analysis.

Also assess only audible delivery characteristics. Confidence means audible decisiveness and steadiness,
not emotion or personality. Pronunciation quality means intelligibility and articulation only; never
penalize a regional or non-native accent. Return exactly the requested JSON object."""
        result = None
        last_error = None
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=[uploaded, prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_json_schema=GeminiVoiceResult.model_json_schema(),
                    ),
                )
                result = GeminiVoiceResult.model_validate(json.loads(response.text or ""))
                break
            except (json.JSONDecodeError, ValidationError) as exc:
                last_error = exc
                logger.warning("Rejected invalid Gemini voice response (attempt %s): %s", attempt + 1, exc)
        if result is None:
            raise ValueError("Gemini returned an invalid voice response") from last_error
        return {
            "available": True,
            "transcript": result.transcript.strip(),
            "language": result.detected_language,
            "engine": "gemini",
            "confidence_level": round(result.confidence_level, 1),
            "fluency": round(result.fluency, 1),
            "pronunciation_quality": round(result.pronunciation_quality, 1),
            "voice_clarity": round(result.voice_clarity, 1),
        }
    except Exception as exc:  # noqa: BLE001
        logger.exception("Gemini official transcription unavailable for media file %s", file_path)
        return _unavailable("Gemini could not create a valid official transcript. Please try recording again.")
    finally:
        if uploaded is not None and client is not None:
            try:
                client.files.delete(name=uploaded.name)
            except Exception:  # noqa: BLE001
                logger.info("Could not delete temporary Gemini media file %s", uploaded.name)
        if normalized_path and os.path.exists(normalized_path):
            try:
                os.remove(normalized_path)
            except OSError:
                logger.warning("Could not delete normalized transcription file %s", normalized_path)


def _unavailable(message: str) -> dict:
    return {
        "available": False, "transcript": None, "language": None, "engine": "unavailable",
        "confidence_level": None, "fluency": None, "pronunciation_quality": None,
        "voice_clarity": None, "message": message,
    }
