"""Transparent, configurable ATS-readiness scoring formula.

IMPORTANT: this produces an *estimated, AI-assisted* readiness score. It does
not reproduce any specific employer's actual ATS behaviour, and callers must
surface it to users labelled as such (see schemas/resume.py + the frontend copy).
"""

import re
from app.ai.resume.section_detector import section_completeness_score

DEFAULT_WEIGHTS = {
    "required_skills": 0.30,
    "role_keywords": 0.20,
    "section_completeness": 0.15,
    "experience_relevance": 0.15,
    "formatting": 0.10,
    "education_relevance": 0.05,
    "achievement_quality": 0.05,
}

ACTION_VERBS = [
    "led", "built", "designed", "developed", "implemented", "created", "managed", "improved",
    "reduced", "increased", "launched", "optimized", "automated", "delivered", "architected",
    "mentored", "coordinated", "resolved", "streamlined", "deployed",
]


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def score_required_skills(matched: list[str], required: list[str]) -> float:
    if not required:
        return 70.0  # neutral score when no target role/required list was given
    return _clamp(100.0 * len(matched) / len(required))


def score_role_keywords(matched_keywords: list[str], total_keywords: list[str]) -> float:
    if not total_keywords:
        return 70.0
    return _clamp(100.0 * len(matched_keywords) / len(total_keywords))


def score_formatting(resume_text: str) -> float:
    """Heuristics: reasonable length, presence of bullet-like structure, no huge unbroken blocks."""
    score = 100.0
    word_count = len(resume_text.split())
    if word_count < 150:
        score -= 30
    elif word_count > 1400:
        score -= 15
    bullet_markers = len(re.findall(r"(^|\n)\s*[•\-\*]\s+", resume_text))
    if bullet_markers < 3:
        score -= 20
    longest_line = max((len(line) for line in resume_text.splitlines()), default=0)
    if longest_line > 400:
        score -= 15
    return _clamp(score)


def score_experience_relevance(resume_text: str, required_skills_matched: int, required_skills_total: int) -> float:
    has_experience_dates = bool(re.search(r"(19|20)\d{2}\s*(-|–|to)\s*((19|20)\d{2}|present|current)", resume_text, re.I))
    base = 55.0 if has_experience_dates else 35.0
    coverage_bonus = 45.0 * (required_skills_matched / required_skills_total) if required_skills_total else 25.0
    return _clamp(base * 0.5 + coverage_bonus)


def score_education_relevance(sections_detected: dict[str, bool]) -> float:
    return 85.0 if sections_detected.get("education") else 35.0


def score_achievement_quality(resume_text: str) -> float:
    lowered = resume_text.lower()
    verb_hits = sum(1 for v in ACTION_VERBS if v in lowered)
    quantified_hits = len(re.findall(r"\b\d+(\.\d+)?\s?(%|percent|x|k|million|hours|days|users|customers)\b", lowered))
    score = 30 + verb_hits * 6 + quantified_hits * 8
    return _clamp(score)


def compute_ats_score(
    *, resume_text: str, sections_detected: dict[str, bool], matched_required_skills: list[str],
    required_skills: list[str], matched_keywords: list[str], role_keywords: list[str],
    weights: dict[str, float] | None = None,
) -> dict:
    w = weights or DEFAULT_WEIGHTS

    component_scores = {
        "required_skills": score_required_skills(matched_required_skills, required_skills),
        "role_keywords": score_role_keywords(matched_keywords, role_keywords),
        "section_completeness": _clamp(section_completeness_score(sections_detected)),
        "experience_relevance": score_experience_relevance(resume_text, len(matched_required_skills), len(required_skills)),
        "formatting": score_formatting(resume_text),
        "education_relevance": score_education_relevance(sections_detected),
        "achievement_quality": score_achievement_quality(resume_text),
    }

    overall = sum(component_scores[k] * w[k] for k in w)
    return {
        "overall_score": round(_clamp(overall), 1),
        "keyword_score": round(component_scores["role_keywords"], 1),
        "formatting_score": round(component_scores["formatting"], 1),
        "experience_score": round(component_scores["experience_relevance"], 1),
        "education_score": round(component_scores["education_relevance"], 1),
        "achievement_score": round(component_scores["achievement_quality"], 1),
        "section_completeness_score": round(component_scores["section_completeness"], 1),
        "weights_used": w,
    }
