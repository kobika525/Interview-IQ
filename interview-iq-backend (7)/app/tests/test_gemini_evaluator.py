import json

import pytest

from app.ai.interview import text_evaluator
from app.core.exceptions import AIServiceError


VALID = {
    "overall_score": 84, "technical_accuracy": 86, "communication": 81,
    "confidence": 79, "grammar": 88, "fluency": 80, "relevance": 90,
    "problem_solving": 83, "strengths": ["Specific technical reasoning"],
    "weaknesses": ["Needs a measurable result"],
    "improved_answer": "I would first clarify requirements, compare alternatives, implement the safest option, and measure the result.",
    "interview_tips": ["Explain trade-offs explicitly"],
    "career_advice": ["Build more production API examples"],
    "suggested_learning_resources": ["Official framework documentation"],
    "follow_up_question": "What trade-off would change your decision?",
}


def _evaluate():
    return text_evaluator.evaluate_answer(
        answer_text="I would clarify requirements and compare trade-offs.",
        question_text="How would you design this service?", expected_keywords=["ignored"],
        interview_type="TECHNICAL", sample_answer=None,
    )


def test_valid_gemini_json_is_mapped_to_legacy_and_new_fields(monkeypatch):
    monkeypatch.setattr(text_evaluator, "generate_json", lambda *_args, **_kwargs: json.dumps(VALID))
    result = _evaluate()
    assert result["overall_score"] == 84
    assert result["technical_score"] == 86
    assert result["matched_keywords"] == []
    assert result["evaluation_provider"] == "gemini"


@pytest.mark.parametrize("payload", [
    {**VALID, "overall_score": 101},
    {key: value for key, value in VALID.items() if key != "fluency"},
    {**VALID, "unexpected": "field"},
])
def test_invalid_gemini_json_is_rejected_after_retry(monkeypatch, payload):
    calls = 0
    def invalid(*_args, **_kwargs):
        nonlocal calls
        calls += 1
        return json.dumps(payload)
    monkeypatch.setattr(text_evaluator, "generate_json", invalid)
    with pytest.raises(AIServiceError):
        _evaluate()
    assert calls == 2
