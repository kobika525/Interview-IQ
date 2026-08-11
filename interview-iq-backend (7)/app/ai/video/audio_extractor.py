"""Extract a normalized mono WAV track from an uploaded interview video."""

import os
import subprocess
import tempfile

import imageio_ffmpeg


def extract_audio_track(video_path: str) -> str:
    """Return a temporary 16 kHz mono WAV path owned by the caller."""
    descriptor, audio_path = tempfile.mkstemp(prefix="interview-iq-video-audio-", suffix=".wav")
    os.close(descriptor)
    command = [
        imageio_ffmpeg.get_ffmpeg_exe(),
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        video_path,
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "pcm_s16le",
        audio_path,
    ]
    try:
        completed = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=180,
        )
        if completed.returncode != 0 or not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
            message = completed.stderr.strip() or "FFmpeg did not produce an audio track."
            raise RuntimeError(f"Unable to extract video audio: {message}")
        return audio_path
    except Exception:
        if os.path.exists(audio_path):
            os.remove(audio_path)
        raise
