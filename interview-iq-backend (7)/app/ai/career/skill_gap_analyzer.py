"""Structured, deterministic skill-gap analysis for a selected career role."""

from app.ai.career.career_matcher import (
    canonical_skill, compare_skills, education_alignment, experience_alignment,
)

SKILL_DIFFICULTY = {
    "git": "beginner", "html": "beginner", "css": "beginner", "rest apis": "beginner", "sql": "beginner",
    "system design": "advanced", "kubernetes": "advanced", "distributed systems": "advanced",
    "machine learning": "advanced", "microservices": "advanced", "cicd": "intermediate",
}


def _bucket(skill: str) -> str:
    return SKILL_DIFFICULTY.get(canonical_skill(skill), "intermediate")


def _weighted_score(user_skills: list[str], skills: list[str], weights: dict[str, float] | None) -> float:
    if not skills:
        return 100.0
    matched, _ = compare_skills(user_skills, skills)
    known = {canonical_skill(skill) for skill in matched}
    values = weights or {}
    total = sum(max(0.1, values.get(canonical_skill(skill), 1.0)) for skill in skills)
    earned = sum(max(0.1, values.get(canonical_skill(skill), 1.0)) for skill in skills if canonical_skill(skill) in known)
    return 100.0 * earned / total


def analyze_skill_gap(
    *, user_skills: list[str], required_skills: list[str], recommended_skills: list[str],
    user_experience_level: str | None = None, role_experience_level: str | None = None,
    education_level: str | None = None, role_description: str = "", career_goals: str | None = None,
    required_weights: dict[str, float] | None = None, recommended_weights: dict[str, float] | None = None,
) -> dict:
    matched_required, missing_required = compare_skills(user_skills, required_skills)
    matched_recommended, missing_recommended = compare_skills(user_skills, recommended_skills)
    matched = matched_required + [skill for skill in matched_recommended if skill not in matched_required]
    all_missing = missing_required + [skill for skill in missing_recommended if skill not in missing_required]

    required_score = _weighted_score(user_skills, required_skills, required_weights)
    recommended_score = _weighted_score(user_skills, recommended_skills, recommended_weights)
    skill_score = required_score * 0.85 + recommended_score * 0.15
    exp_score = experience_alignment(user_experience_level, role_experience_level)
    edu_score = education_alignment(education_level, role_description)
    readiness = skill_score * 0.75 + exp_score * 0.15 + edu_score * 0.10

    beginner, intermediate, advanced = [], [], []
    for skill in all_missing:
        {"beginner": beginner, "intermediate": intermediate, "advanced": advanced}[_bucket(skill)].append(skill)

    priority = sorted(
        missing_required,
        key=lambda skill: (required_weights or {}).get(canonical_skill(skill), 1.0),
        reverse=True,
    )[:3] or all_missing[:3]
    recommendations = []
    if priority:
        recommendations.append(f"Start with the highest-priority role requirements: {', '.join(priority)}.")
    if exp_score < 100:
        recommendations.append("Build role-level experience through one portfolio project with measurable outcomes.")
    if edu_score < 70:
        recommendations.append("Address the role's education requirement with a relevant qualification or equivalent portfolio evidence.")
    if career_goals:
        recommendations.append(f"Align your next learning milestone with your stated goal: {career_goals}.")
    if not all_missing:
        recommendations.append("Your documented skills cover the role; focus on interview evidence and recent project impact.")

    estimated_weeks = sum({"beginner": 1, "intermediate": 2, "advanced": 4}[_bucket(skill)] for skill in all_missing)
    return {
        "readiness_score": round(max(0.0, min(100.0, readiness)), 1),
        "matched_skills": matched, "missing_skills": all_missing, "priority_gaps": priority,
        "beginner_skills": beginner, "intermediate_skills": intermediate, "advanced_skills": advanced,
        "estimated_prep_weeks": max(1, estimated_weeks) if all_missing else 0,
        "score_breakdown": {
            "requiredSkills": round(required_score, 1), "recommendedSkills": round(recommended_score, 1),
            "experience": round(exp_score, 1), "education": round(edu_score, 1),
        },
        "recommendations": recommendations,
    }
