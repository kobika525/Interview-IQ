"""Google Gemini text and schema-constrained JSON client."""

import logging

from app.config import settings

logger = logging.getLogger("app.ai.llm")


def create_client(timeout: float = 45):
    """Create the shared retry-configured Gemini client.

    Keeping transport policy here ensures text evaluation and media processing
    retry the same transient statuses without duplicating configuration.
    """
    from google import genai
    from google.genai import types

    return genai.Client(
        api_key=settings.GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=int(timeout * 1000),
            retryOptions=types.HttpRetryOptions(
                attempts=3, initialDelay=0.5, maxDelay=4.0, expBase=2.0,
                jitter=0.2, httpStatusCodes=[429, 500, 502, 503, 504],
            ),
        ),
    )


def generate(prompt: str, timeout: float | None = None) -> str | None:
    if not settings.GEMINI_API_KEY:
        return None
    try:
        client = create_client(timeout or settings.OLLAMA_TIMEOUT_SECONDS)
        response = client.models.generate_content(model=settings.GEMINI_MODEL, contents=prompt)
        return (response.text or "").strip() or None
    except Exception as exc:  # noqa: BLE001
        logger.info("Gemini API unavailable, falling back: %s", exc)
        return None


def generate_json(prompt: str, timeout: float | None = None, response_schema: dict | None = None) -> str | None:
    """Generate a JSON-only response using Gemini's constrained output mode."""
    if not settings.GEMINI_API_KEY:
        logger.error("Gemini evaluation requested without GEMINI_API_KEY")
        return None
    try:
        from google.genai import types

        client = create_client(timeout or 45)
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json", response_json_schema=response_schema,
            ),
        )
        return (response.text or "").strip() or None
    except Exception as exc:  # noqa: BLE001
        logger.warning("Gemini JSON generation unavailable: %s", exc)
        return None
