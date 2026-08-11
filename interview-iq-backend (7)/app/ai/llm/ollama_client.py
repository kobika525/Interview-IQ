"""Thin client for a locally running Ollama instance. Every call degrades
gracefully to `None` on any failure (connection refused, timeout, model not
pulled, etc.) so callers can fall back to deterministic logic — the app must
never depend on this being available."""

import logging

import httpx

from app.config import settings

logger = logging.getLogger("app.ai.llm")


def generate(prompt: str, timeout: float | None = None) -> str | None:
    try:
        response = httpx.post(
            f"{settings.OLLAMA_BASE_URL}/api/generate",
            json={"model": settings.OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=timeout or settings.OLLAMA_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return response.json().get("response", "").strip() or None
    except Exception as exc:  # noqa: BLE001
        logger.info("Ollama unavailable, using deterministic fallback: %s", exc)
        return None


def is_available() -> bool:
    try:
        response = httpx.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=2.0)
        return response.status_code == 200
    except Exception:
        return False
