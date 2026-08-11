"""Optional cloud AI provider. Same contract as ollama_client.generate():
returns a string on success, None on any failure, so callers can fall back
to deterministic logic exactly the same way."""

import logging

from app.config import settings

logger = logging.getLogger("app.ai.llm")


def generate(prompt: str, timeout: float | None = None) -> str | None:
    if not settings.ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip() or None
    except Exception as exc:  # noqa: BLE001
        logger.info("Anthropic API unavailable, falling back: %s", exc)
        return None
