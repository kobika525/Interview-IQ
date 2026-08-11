"""Deterministic, evidence-based career matching.

Scores are calculated locally from structured role requirements and user evidence.
An LLM may improve wording later, but it is never allowed to change scores or gaps.
"""

import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

EXPERIENCE_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]

SKILL_ALIASES = {
    "js": "javascript", "javascript es6": "javascript",
    "reactjs": "react", "react js": "react",
    "node": "nodejs", "node js": "nodejs",
    "rest api": "rest apis", "restful api": "rest apis", "restful apis": "rest apis",
    "postgres": "postgresql", "postgre sql": "postgresql",
    "ci cd": "cicd", "continuous integration": "cicd",
    "k8s": "kubernetes", "amazon web services": "aws",
    "ml": "machine learning", "qa": "quality assurance",
}


def canonical_skill(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9+#]+", " ", (value or "").lower()).strip()
    normalized = re.sub(r"\s+", " ", normalized)
    return SKILL_ALIASES.get(normalized, normalized.replace(" ", "") if normalized in {"node js", "react js"} else normalized)


def _user_skill_index(skills: list[str]) -> set[str]:
    return {canonical_skill(skill) for skill in skills if canonical_skill(skill)}


def compare_skills(user_skills: list[str], role_skills: list[str]) -> tuple[list[str], list[str]]:
    known = _user_skill_index(user_skills)
    matched = [skill for skill in role_skills if canonical_skill(skill) in known]
    missing = [skill for skill in role_skills if canonical_skill(skill) not in known]
    return matched, missing


def _weighted_coverage(user_skills: list[str], role_skills: list[str], weights: dict[str, float] | None) -> float:
    if not role_skills:
        return 100.0
    known = _user_skill_index(user_skills)
    skill_weights = weights or {}
    total = sum(max(0.1, float(skill_weights.get(canonical_skill(skill), 1.0))) for skill in role_skills)
    earned = sum(
        max(0.1, float(skill_weights.get(canonical_skill(skill), 1.0)))
        for skill in role_skills if canonical_skill(skill) in known
    )
    return 100.0 * earned / total


def experience_alignment(user_level: str | None, role_level: str | None) -> float:
    try:
        user_index = EXPERIENCE_ORDER.index((user_level or "BEGINNER").upper())
        role_index = EXPERIENCE_ORDER.index((role_level or "BEGINNER").upper())
    except ValueError:
        return 60.0
    if user_index >= role_index:
        return 100.0
    return {1: 55.0, 2: 20.0}.get(role_index - user_index, 20.0)


def education_alignment(education: str | None, role_text: str) -> float:
    text = (role_text or "").lower()
    if not any(term in text for term in ("degree", "bachelor", "master", "phd", "diploma")):
        return 80.0 if education else 65.0
    education_text = (education or "").lower()
    if "phd" in text:
        return 100.0 if "phd" in education_text else 30.0
    if "master" in text:
        return 100.0 if any(term in education_text for term in ("master", "phd")) else 45.0
    if any(term in text for term in ("degree", "bachelor")):
        return 100.0 if any(term in education_text for term in ("undergraduate", "graduate", "bachelor", "degree", "master", "postgraduate", "phd")) else 50.0
    return 80.0


def _text_similarity(left: str | None, right: str | None, default: float) -> float:
    if not left or not left.strip() or not right or not right.strip():
        return default
    try:
        matrix = TfidfVectorizer(stop_words="english", max_features=2500, ngram_range=(1, 2)).fit_transform([left, right])
        return round(float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0]) * 100, 1)
    except Exception:
        return default


def match_career_role(
    *, user_skills: list[str], required_skills: list[str], recommended_skills: list[str],
    user_experience_level: str, role_experience_level: str, resume_text: str | None,
    role_description: str, preferred_industry: str | None = None,
    education_level: str | None = None, career_context: str | None = None,
    required_weights: dict[str, float] | None = None,
    recommended_weights: dict[str, float] | None = None,
) -> dict:
    required_score = _weighted_coverage(user_skills, required_skills, required_weights)
    recommended_score = _weighted_coverage(user_skills, recommended_skills, recommended_weights)
    experience_score = experience_alignment(user_experience_level, role_experience_level)
    resume_score = _text_similarity(resume_text, role_description, 55.0 if resume_text else 45.0)
    goals = " ".join(filter(None, [career_context, preferred_industry]))
    goal_score = _text_similarity(goals, role_description, 60.0)
    education_score = education_alignment(education_level, role_description)

    breakdown = {
        "requiredSkills": round(required_score, 1),
        "recommendedSkills": round(recommended_score, 1),
        "experience": round(experience_score, 1),
        "resume": round(resume_score, 1),
        "education": round(education_score, 1),
        "careerGoals": round(goal_score, 1),
    }
    overall = (
        required_score * 0.50 + recommended_score * 0.10 + experience_score * 0.15
        + resume_score * 0.10 + goal_score * 0.10 + education_score * 0.05
    )
    matched, missing = compare_skills(user_skills, required_skills)
    priority = sorted(
        missing,
        key=lambda skill: (required_weights or {}).get(canonical_skill(skill), 1.0),
        reverse=True,
    )[:3]
    explanation = (
        f"Matched {len(matched)}/{len(required_skills)} required skills ({required_score:.0f}% weighted coverage). "
        f"Experience alignment is {experience_score:.0f}%, resume relevance {resume_score:.0f}%, "
        f"and career-goal alignment {goal_score:.0f}%."
    )
    return {
        "match_score": round(max(0.0, min(100.0, overall)), 1),
        "matched_skills": matched, "missing_skills": missing,
        "priority_skills": priority, "explanation": explanation,
        "score_breakdown": breakdown,
    }
