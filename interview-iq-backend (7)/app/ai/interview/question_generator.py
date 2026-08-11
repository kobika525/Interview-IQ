"""Fallback question generation used when the admin-managed question bank
doesn't have enough matching questions for a session. Template-based and
fully deterministic — the interview flow must keep working even when
app.ai.llm.ollama_client is unavailable (see fallback_generator for the LLM-enriched path)."""

TECHNICAL_TEMPLATES = [
    "Explain how you would approach designing a {topic} system for a growing user base.",
    "Walk me through the trade-offs you would consider when implementing {topic}.",
    "Describe a challenging bug you've encountered related to {topic} and how you resolved it.",
    "How would you test and validate a {topic} implementation before deploying it?",
]
BEHAVIORAL_TEMPLATES = [
    "Tell me about a time you had to learn {topic} quickly to complete a project.",
    "Describe a situation where you disagreed with a teammate about how to approach {topic}.",
    "Tell me about a time a {topic}-related project didn't go as planned. What did you do?",
]


def generate_fallback_question(topic: str, interview_type: str, difficulty: str) -> dict:
    templates = BEHAVIORAL_TEMPLATES if interview_type in ("HR", "BEHAVIORAL") else TECHNICAL_TEMPLATES
    import random

    template = random.choice(templates)
    return {
        "question_text": template.format(topic=topic),
        "topic": topic,
        "category": topic,
        "difficulty": difficulty,
        "interview_type": interview_type if interview_type != "MIXED" else "TECHNICAL",
        "expected_keywords": [topic.lower()],
        "expected_key_points": [f"Clear explanation involving {topic}", "A concrete example", "A measurable or logical outcome"],
        "sample_answer": None,
        "source": "TEMPLATE",
    }


def generate_fallback_questions(topics: list[str], count: int, interview_type: str, difficulty: str) -> list[dict]:
    if not topics:
        topics = ["general software engineering"]
    result = []
    for i in range(count):
        topic = topics[i % len(topics)]
        result.append(generate_fallback_question(topic, interview_type, difficulty))
    return result
