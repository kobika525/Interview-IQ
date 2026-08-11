"""Generates human-readable strengths / weaknesses / suggestions from the
numeric analysis. Deterministic rule-based generation — no LLM required,
though app.ai.llm.fallback_generator can enrich this later if Ollama is present."""


def build_strengths(scores: dict, sections: dict[str, bool], matched_skills: list[str]) -> list[str]:
    strengths = []
    if scores["formatting_score"] >= 75:
        strengths.append("Clean, well-structured formatting with clear bullet points.")
    if scores["achievement_score"] >= 65:
        strengths.append("Good use of action verbs and quantified achievements.")
    if matched_skills:
        strengths.append(f"Strong overlap with target-role skills: {', '.join(matched_skills[:5])}.")
    if sections.get("projects"):
        strengths.append("Includes a dedicated projects section, which strengthens practical evidence of skills.")
    if scores["experience_score"] >= 70:
        strengths.append("Experience section clearly demonstrates relevant, dated work history.")
    if not strengths:
        strengths.append("Resume was successfully parsed and contains identifiable structure.")
    return strengths


def build_weaknesses(scores: dict, sections: dict[str, bool], missing_skills: list[str]) -> list[str]:
    weaknesses = []
    if scores["formatting_score"] < 60:
        weaknesses.append("Formatting could be clearer — consider using concise bullet points instead of long paragraphs.")
    if scores["achievement_score"] < 50:
        weaknesses.append("Few quantified achievements or action verbs were detected — bullets read as duties rather than impact.")
    if missing_skills:
        weaknesses.append(f"Missing several skills relevant to the target role: {', '.join(missing_skills[:5])}.")
    if not sections.get("summary"):
        weaknesses.append("No professional summary detected — a 2-3 line summary helps recruiters quickly see fit.")
    if not sections.get("projects"):
        weaknesses.append("No dedicated projects section — practical project evidence strengthens weaker experience sections.")
    if not weaknesses:
        weaknesses.append("No major issues detected — focus on tailoring keywords to each specific job description.")
    return weaknesses


def build_suggestions(scores: dict, sections: dict[str, bool], missing_skills: list[str]) -> list[str]:
    suggestions = []
    if missing_skills:
        suggestions.append(f"Add or highlight experience with: {', '.join(missing_skills[:5])} if you have any, even from coursework or personal projects.")
    if scores["achievement_score"] < 60:
        suggestions.append('Quantify at least 2-3 bullet points (e.g. "reduced load time by 30%", "supported 200+ users").')
    if not sections.get("summary"):
        suggestions.append("Add a short professional summary at the top targeting your desired role.")
    if scores["formatting_score"] < 70:
        suggestions.append("Break up dense paragraphs into scannable bullet points, ideally 1-2 lines each.")
    if scores["section_completeness_score"] < 80:
        missing = [s for s, present in sections.items() if not present]
        if missing:
            suggestions.append(f"Consider adding these commonly expected sections: {', '.join(missing)}.")
    if not suggestions:
        suggestions.append("Your resume is in strong shape — keep tailoring keywords per job description.")
    return suggestions
