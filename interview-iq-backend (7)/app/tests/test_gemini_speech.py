import json

import pytest
from pydantic import ValidationError

from app.ai.speech.speech_to_text import GeminiVoiceResult


def test_gemini_voice_schema_accepts_complete_bounded_result():
    result = GeminiVoiceResult.model_validate({
        "transcript": "Um, I would begin by clarifying the requirements.",
        "detected_language": "English", "confidence_level": 82,
        "fluency": 79, "pronunciation_quality": 88, "voice_clarity": 86,
    })
    assert result.transcript.startswith("Um")
    assert result.voice_clarity == 86


@pytest.mark.parametrize("payload", [
    {"transcript": "", "detected_language": "English", "confidence_level": 80,
     "fluency": 80, "pronunciation_quality": 80, "voice_clarity": 80},
    {"transcript": "Answer", "detected_language": "English", "confidence_level": 101,
     "fluency": 80, "pronunciation_quality": 80, "voice_clarity": 80},
    {"transcript": "Answer", "detected_language": "English", "confidence_level": 80,
     "fluency": 80, "pronunciation_quality": 80, "voice_clarity": 80, "extra": True},
])
def test_gemini_voice_schema_rejects_invalid_result(payload):
    with pytest.raises(ValidationError):
        GeminiVoiceResult.model_validate_json(json.dumps(payload))
