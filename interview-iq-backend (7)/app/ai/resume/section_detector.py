"""Rule-based resume section detection using header keywords and structural
heuristics. Deterministic — no external model dependency."""

import re

SECTION_KEYWORDS = {
    "contact": ["email", "phone", "linkedin", "github", "@"],
    "summary": ["summary", "objective", "profile", "about me"],
    "education": ["education", "academic", "university", "degree", "bachelor", "b.sc", "bsc"],
    "experience": ["experience", "employment", "work history", "internship", "professional experience"],
    "skills": ["skills", "technical skills", "technologies", "tech stack", "proficiencies"],
    "projects": ["projects", "personal projects", "academic projects", "portfolio"],
}


def detect_sections(resume_text: str) -> dict[str, bool]:
    lowered = resume_text.lower()
    result: dict[str, bool] = {}
    for section, keywords in SECTION_KEYWORDS.items():
        result[section] = any(keyword in lowered for keyword in keywords)

    # Contact info is more reliable via pattern matching than keyword presence.
    has_email = bool(re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", resume_text))
    has_phone = bool(re.search(r"(\+?\d[\d\s().-]{7,}\d)", resume_text))
    result["contact"] = has_email or has_phone or result["contact"]

    return result


def section_completeness_score(sections: dict[str, bool]) -> float:
    """Weighted: contact/education/experience/skills matter most; summary/projects are bonus."""
    weights = {"contact": 20, "education": 20, "experience": 25, "skills": 20, "summary": 7, "projects": 8}
    return round(sum(weights[s] for s, present in sections.items() if present), 1)
