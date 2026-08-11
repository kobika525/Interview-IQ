"""Deterministic keyword/alias-based skill extraction. Designed to run without
spaCy/transformer downloads, while remaining easy to upgrade later (see the
optional NLP hook at the bottom)."""

import re

# A reasonably broad, curated taxonomy used when no specific target-role skill
# list is supplied (e.g. general resume scan without a chosen role).
DEFAULT_SKILL_TAXONOMY: list[str] = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby",
    "React", "Vue", "Angular", "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot",
    "HTML", "CSS", "Tailwind CSS", "Bootstrap",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite",
    "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "CI/CD", "Terraform", "Linux",
    "Git", "REST APIs", "GraphQL", "Microservices", "System Design",
    "Machine Learning", "Data Analysis", "Pandas", "NumPy", "TensorFlow", "PyTorch",
    "Agile", "Scrum", "Communication", "Leadership", "Problem Solving", "Teamwork",
]

# Common aliases mapped to their canonical taxonomy name.
SKILL_ALIASES: dict[str, str] = {
    "js": "JavaScript", "ts": "TypeScript", "node": "Node.js", "nodejs": "Node.js",
    "postgres": "PostgreSQL", "k8s": "Kubernetes", "gcp": "Google Cloud", "ml": "Machine Learning",
    "reactjs": "React", "vuejs": "Vue", "html5": "HTML", "css3": "CSS",
}


def _find_skill_in_text(skill: str, lowered_text: str) -> bool:
    escaped = re.escape(skill.lower())
    pattern = rf"(?<![a-z0-9]){escaped}(?![a-z0-9])" if re.match(r"^[\w+#.]+$", skill) else escaped
    return re.search(pattern, lowered_text) is not None


def extract_matched_skills(text: str, candidate_skills: list[str]) -> list[str]:
    """Given a list of candidate skill names (e.g. a role's required skills),
    return the subset actually found in the resume/answer text."""
    lowered = text.lower()
    matched = []
    for skill in candidate_skills:
        if _find_skill_in_text(skill, lowered):
            matched.append(skill)
            continue
        alias_hit = any(canon.lower() == skill.lower() and _find_skill_in_text(alias, lowered) for alias, canon in SKILL_ALIASES.items())
        if alias_hit:
            matched.append(skill)
    return matched


def extract_general_skills(text: str, taxonomy: list[str] | None = None) -> list[str]:
    """Scans free-form resume text against the default (or supplied) taxonomy."""
    taxonomy = taxonomy or DEFAULT_SKILL_TAXONOMY
    lowered = text.lower()
    found = [skill for skill in taxonomy if _find_skill_in_text(skill, lowered)]
    for alias, canonical in SKILL_ALIASES.items():
        if canonical not in found and _find_skill_in_text(alias, lowered):
            found.append(canonical)
    return sorted(set(found))


# --- Optional richer-NLP hook -------------------------------------------------
# If spaCy + en_core_web_sm are installed in the deployment environment, this
# will be used automatically for noun-phrase based candidate discovery in
# addition to the deterministic taxonomy match above. Fully optional.
def try_extract_noun_phrases(text: str) -> list[str]:
    try:
        import spacy  # type: ignore

        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text[:20000])
        return list({chunk.text.strip() for chunk in doc.noun_chunks if 1 < len(chunk.text.strip()) < 40})
    except Exception:
        return []
