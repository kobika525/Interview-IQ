"""Optional Gemini wording enhancement for deterministic career recommendations."""

import json

from app.ai.llm.gemini_client import generate_json


def enrich_recommendations(base: list[str], context: dict) -> list[str]:
    """Return clearer advice when Gemini is available, otherwise the safe base list.

    Scores, matched skills, missing skills, and priorities are deliberately not
    sent back as mutable output fields, so an LLM can never change analysis facts.
    """
    if not base:
        return base
    prompt = (
        "Improve the wording of these career improvement recommendations. Keep every recommendation factual, "
        "specific, concise, and actionable. Do not add skills, remove skills, alter scores, or invent job requirements.\n"
        f"Context: {json.dumps(context, ensure_ascii=True)}\n"
        f"Recommendations: {json.dumps(base, ensure_ascii=True)}"
    )
    schema = {
        "type": "object",
        "properties": {"recommendations": {"type": "array", "items": {"type": "string"}, "minItems": 1, "maxItems": 5}},
        "required": ["recommendations"], "additionalProperties": False,
    }
    raw = generate_json(prompt, timeout=12, response_schema=schema)
    if not raw:
        return base
    try:
        values = json.loads(raw).get("recommendations", [])
        cleaned = [str(value).strip() for value in values if str(value).strip()]
        return cleaned[:5] or base
    except (TypeError, ValueError, json.JSONDecodeError):
        return base
