"""Entry points that try the local LLM first, then an optional cloud API,
then fall back to the deterministic template-based generators. This is the
ONLY place that decides between "real" LLM output and the fallback — every
other module stays LLM-agnostic."""

from app.ai.interview.question_generator import generate_fallback_question
from app.ai.llm import anthropic_client, gemini_client, ollama_client
from app.ai.llm.prompt_templates import FEEDBACK_ENRICHMENT_PROMPT, QUESTION_GENERATION_PROMPT


def _generate_with_any_provider(prompt: str, timeout: float | None = None) -> str | None:
    from app.config import settings

    providers = {
        "local": (ollama_client.generate, gemini_client.generate, anthropic_client.generate),
        "ollama": (ollama_client.generate, gemini_client.generate, anthropic_client.generate),
        "gemini": (gemini_client.generate, ollama_client.generate, anthropic_client.generate),
        "anthropic": (anthropic_client.generate, gemini_client.generate, ollama_client.generate),
    }
    ordered = providers.get(settings.AI_MODE.lower(), providers["local"])
    for provider in ordered:
        result = provider(prompt, timeout)
        if result:
            return result
    return None


def generate_question_with_fallback(topic: str, interview_type: str, difficulty: str, role: str = "software") -> dict:
    prompt = QUESTION_GENERATION_PROMPT.format(topic=topic, interview_type=interview_type, difficulty=difficulty, role=role)
    llm_text = _generate_with_any_provider(prompt)
    fallback = generate_fallback_question(topic, interview_type, difficulty)
    if llm_text:
        fallback["question_text"] = llm_text
        fallback["source"] = "LLM"
    return fallback


def enrich_feedback_with_fallback(question: str, answer: str, deterministic_feedback: str) -> str:
    prompt = FEEDBACK_ENRICHMENT_PROMPT.format(question=question, answer=answer)
    llm_text = _generate_with_any_provider(prompt, timeout=15)
    return llm_text or deterministic_feedback
