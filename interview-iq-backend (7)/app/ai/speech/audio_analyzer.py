"""Objective voice metrics derived from official transcript and audio silence."""

import re
import subprocess

from app.config import settings

FILLER_PATTERNS = (
    r"\bum+\b", r"\buh+\b", r"\berm+\b", r"\bah+\b", r"\blike\b",
    r"\byou know\b", r"\bsort of\b", r"\bkind of\b", r"\bbasically\b",
    r"\bactually\b", r"\bI mean\b",
)


def _ffmpeg_executable() -> str:
    try:
        import imageio_ffmpeg  # type: ignore
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:  # noqa: BLE001
        return settings.FFMPEG_PATH


def _media_timing(file_path: str) -> dict:
    """Read duration and silence intervals without modifying the recording."""
    command = [
        _ffmpeg_executable(), "-hide_banner", "-nostdin", "-i", file_path,
        "-af", "silencedetect=noise=-35dB:d=0.35", "-f", "null", "-",
    ]
    try:
        completed = subprocess.run(command, capture_output=True, text=True, timeout=60, check=False)
        output = completed.stderr or ""
    except (OSError, subprocess.SubprocessError):
        return {"recording_duration": None, "average_pause": None, "longest_pause": None, "long_pause_count": None}

    duration = None
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", output)
    if match:
        duration = round(int(match.group(1)) * 3600 + int(match.group(2)) * 60 + float(match.group(3)), 2)
    pauses = [float(value) for value in re.findall(r"silence_duration:\s*([0-9.]+)", output)]
    return {
        "recording_duration": duration,
        "average_pause": round(sum(pauses) / len(pauses), 2) if pauses else 0.0,
        "longest_pause": round(max(pauses), 2) if pauses else 0.0,
        "long_pause_count": sum(1 for pause in pauses if pause >= 1.0),
    }


def _speaking_speed(wpm: float | None) -> str | None:
    if wpm is None:
        return None
    if wpm < 100:
        return "slow"
    if wpm <= 160:
        return "balanced"
    if wpm <= 190:
        return "fast"
    return "very_fast"


def analyze_recording(file_path: str, transcript: str, gemini_voice: dict | None = None) -> dict:
    timing = _media_timing(file_path)
    word_count = len(re.findall(r"\b[\w'-]+\b", transcript, flags=re.UNICODE))
    lowered = transcript.lower()
    filler_count = sum(len(re.findall(pattern, lowered, flags=re.IGNORECASE)) for pattern in FILLER_PATTERNS)
    duration = timing["recording_duration"]
    wpm = round(word_count * 60 / duration, 1) if duration and duration > 0 else None
    quality = gemini_voice or {}
    return {
        "word_count": word_count,
        "recording_duration": duration,
        "words_per_minute": wpm,
        "speaking_speed": _speaking_speed(wpm),
        "average_pause": timing["average_pause"],
        "longest_pause": timing["longest_pause"],
        "long_pause_count": timing["long_pause_count"],
        "filler_word_count": filler_count,
        "confidence_level": quality.get("confidence_level"),
        "fluency": quality.get("fluency"),
        "pronunciation_quality": quality.get("pronunciation_quality"),
        "voice_clarity": quality.get("voice_clarity"),
        "transcription_engine": quality.get("engine"),
    }
