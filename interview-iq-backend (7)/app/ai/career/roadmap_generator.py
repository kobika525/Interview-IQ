"""Rule-based, template-driven learning roadmap generator.

Builds a staged roadmap (Fundamentals -> Core -> Frameworks -> ... -> Interview
Prep) from a skill-gap result, matching available learning resources where possible.
"""

STAGE_TEMPLATE = [
    ("Fundamentals", "COURSE"),
    ("Core Programming & Tools", "COURSE"),
    ("Frameworks & Databases", "COURSE"),
    ("System Design & Best Practices", "ARTICLE"),
    ("Hands-on Project", "PROJECT"),
    ("Interview Preparation", "PRACTICE"),
]


def generate_roadmap_items(
    *, missing_skills: list[str], beginner_skills: list[str], intermediate_skills: list[str],
    advanced_skills: list[str], weekly_hours: int | None, resource_lookup: dict[str, int] | None = None,
) -> list[dict]:
    """`resource_lookup` optionally maps a skill name (lowercased) -> LearningResource.id
    for services to link real DB resources; falls back to None if not found."""
    resource_lookup = resource_lookup or {}
    weekly_hours = weekly_hours or 6
    items: list[dict] = []
    order = 1

    skill_stages = [
        (beginner_skills, "Fundamentals", "BEGINNER"),
        (intermediate_skills, "Core Programming & Tools", "INTERMEDIATE"),
        (advanced_skills, "System Design & Best Practices", "ADVANCED"),
    ]

    for skills, stage_title, difficulty in skill_stages:
        for skill in skills:
            estimated_hours = 4 if difficulty == "BEGINNER" else 8 if difficulty == "INTERMEDIATE" else 12
            items.append({
                "title": f"{stage_title}: {skill}",
                "description": f"Build working proficiency in {skill} through focused study and practice.",
                "item_type": "COURSE",
                "difficulty": difficulty,
                "order_number": order,
                "estimated_hours": estimated_hours,
                "resource_id": resource_lookup.get(skill.lower()),
                "is_premium_only": order > 2,
            })
            order += 1

    if missing_skills:
        items.append({
            "title": f"Hands-on project applying {', '.join(missing_skills[:3])}",
            "description": "Build a small end-to-end project that exercises your newly acquired skills together.",
            "item_type": "PROJECT",
            "difficulty": "INTERMEDIATE",
            "order_number": order,
            "estimated_hours": 10,
            "resource_id": None,
            "is_premium_only": True,
        })
        order += 1

    items.append({
        "title": "Mock interview practice",
        "description": "Complete at least 3 mock interviews (text, voice, or video) focused on your target role.",
        "item_type": "PRACTICE",
        "difficulty": "INTERMEDIATE",
        "order_number": order,
        "estimated_hours": 6,
        "resource_id": None,
        "is_premium_only": False,
    })

    total_hours = sum(i["estimated_hours"] for i in items)
    estimated_weeks = max(2, round(total_hours / weekly_hours))
    return items, estimated_weeks
