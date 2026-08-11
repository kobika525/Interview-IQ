"""
Centralized, transparent scoring weights. Kept in one importable place so the
formula is never "hidden" and can be tuned without touching business logic.
"""

RESUME_SCORE_WEIGHTS = {
    "required_skills": 0.30,
    "role_keywords": 0.20,
    "section_completeness": 0.15,
    "experience_relevance": 0.15,
    "formatting_readiness": 0.10,
    "education_relevance": 0.05,
    "achievement_quality": 0.05,
}
RESUME_SCORE_WEIGHT_VERSION = "v1"

CAREER_MATCH_WEIGHTS = {
    "required_skill_coverage": 0.45,
    "recommended_skill_coverage": 0.15,
    "experience_alignment": 0.15,
    "semantic_similarity": 0.15,
    "preference_alignment": 0.10,
}
CAREER_MATCH_WEIGHT_VERSION = "v1"

INTERVIEW_TECHNICAL_WEIGHTS = {
    "relevance": 0.25,
    "technical": 0.25,
    "problem_solving": 0.15,
    "structure": 0.15,
    "communication": 0.10,
    "confidence": 0.05,
    "professionalism": 0.05,
}

INTERVIEW_BEHAVIORAL_WEIGHTS = {
    "relevance": 0.25,
    "star": 0.25,
    "communication": 0.20,
    "professionalism": 0.10,
    "example_quality": 0.10,
    "confidence": 0.10,
}

INTERVIEW_SCORE_WEIGHT_VERSION = "v1"


def weighted_score(components: dict[str, float], weights: dict[str, float]) -> float:
    """components and weights share keys; returns a 0-100 weighted average."""
    total = 0.0
    for key, weight in weights.items():
        total += components.get(key, 0.0) * weight
    return round(max(0.0, min(100.0, total)), 1)


def performance_label(score: float) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Strong"
    if score >= 55:
        return "Developing"
    return "Needs practice"
