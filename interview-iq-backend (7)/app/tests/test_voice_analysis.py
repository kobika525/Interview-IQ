from types import SimpleNamespace

from app.ai.speech import audio_analyzer


def test_voice_metrics_use_media_duration_and_detect_pauses_and_fillers(monkeypatch):
    stderr = """
      Duration: 00:01:00.00, start: 0.000000, bitrate: 120 kb/s
      [silencedetect] silence_duration: 0.50
      [silencedetect] silence_duration: 1.25
      [silencedetect] silence_duration: 2.00
    """
    monkeypatch.setattr(
        audio_analyzer.subprocess, "run",
        lambda *_args, **_kwargs: SimpleNamespace(stderr=stderr),
    )
    transcript = "Um I would clarify the requirements and, you know, compare options " + "word " * 110
    result = audio_analyzer.analyze_recording(
        "answer.webm", transcript,
        {"engine": "gemini", "confidence_level": 81, "fluency": 78,
         "pronunciation_quality": 87, "voice_clarity": 85},
    )
    assert result["recording_duration"] == 60.0
    assert result["average_pause"] == 1.25
    assert result["longest_pause"] == 2.0
    assert result["long_pause_count"] == 2
    assert result["filler_word_count"] == 2
    assert result["transcription_engine"] == "gemini"
    assert result["words_per_minute"] > 100


def test_voice_metrics_degrade_to_unknown_when_media_tool_is_missing(monkeypatch):
    def unavailable(*_args, **_kwargs):
        raise FileNotFoundError
    monkeypatch.setattr(audio_analyzer.subprocess, "run", unavailable)
    result = audio_analyzer.analyze_recording("answer.webm", "A clear short answer.", {})
    assert result["recording_duration"] is None
    assert result["words_per_minute"] is None
    assert result["average_pause"] is None
