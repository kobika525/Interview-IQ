"""Idempotent seed for career roles + their required/recommended skills,
matching the roles already used across the frontend."""

from app.database import SessionLocal
from app.models.career import CareerRole
from app.models.skill import RoleSkill, Skill
from app.utils.enums import ExperienceLevel, SkillCategory
from app.utils.slugs import slugify

ROLES = [
    dict(title="Full Stack Developer", description="Builds and ships complete web applications across frontend and backend.",
         experience_level=ExperienceLevel.INTERMEDIATE, demand_level="High", avg_salary_min=60000, avg_salary_max=95000,
         estimated_learning_duration_weeks=10,
         required=["JavaScript", "React", "Node.js", "SQL", "REST APIs"], recommended=["Docker", "System Design"]),
    dict(title="Frontend Developer", description="Crafts fast, accessible, and delightful user interfaces.",
         experience_level=ExperienceLevel.BEGINNER, demand_level="High", avg_salary_min=55000, avg_salary_max=85000,
         estimated_learning_duration_weeks=7,
         required=["JavaScript", "React", "HTML", "CSS"], recommended=["TypeScript", "Testing"]),
    dict(title="Backend Developer", description="Designs APIs, data models, and scalable services.",
         experience_level=ExperienceLevel.INTERMEDIATE, demand_level="High", avg_salary_min=60000, avg_salary_max=95000,
         estimated_learning_duration_weeks=10,
         required=["Python", "SQL", "REST APIs"], recommended=["Kubernetes", "System Design", "Caching"]),
    dict(title="Python Developer", description="Builds backend services, automation, and data tooling in Python.",
         experience_level=ExperienceLevel.BEGINNER, demand_level="High", avg_salary_min=58000, avg_salary_max=90000,
         estimated_learning_duration_weeks=8,
         required=["Python", "SQL", "Git"], recommended=["FastAPI", "Testing"]),
    dict(title="Software Engineer", description="General-purpose engineering across the stack and systems.",
         experience_level=ExperienceLevel.INTERMEDIATE, demand_level="High", avg_salary_min=62000, avg_salary_max=98000,
         estimated_learning_duration_weeks=12,
         required=["JavaScript", "Python", "Git"], recommended=["System Design", "Data Structures"]),
    dict(title="QA Engineer", description="Ensures product quality through manual and automated testing.",
         experience_level=ExperienceLevel.BEGINNER, demand_level="Medium", avg_salary_min=48000, avg_salary_max=75000,
         estimated_learning_duration_weeks=6,
         required=["SQL"], recommended=["Selenium", "API Testing"]),
    dict(title="Data Analyst", description="Turns raw data into insight through analysis and visualization.",
         experience_level=ExperienceLevel.BEGINNER, demand_level="Medium", avg_salary_min=50000, avg_salary_max=78000,
         estimated_learning_duration_weeks=9,
         required=["SQL"], recommended=["Python", "Statistics"]),
    dict(title="DevOps Engineer", description="Automates infrastructure, deployment, and reliability practices.",
         experience_level=ExperienceLevel.ADVANCED, demand_level="High", avg_salary_min=68000, avg_salary_max=105000,
         estimated_learning_duration_weeks=13,
         required=["Linux", "Git", "Docker"], recommended=["Kubernetes", "AWS", "CI/CD"]),
]


def run():
    with SessionLocal() as db:
        created = 0
        for role_data in ROLES:
            slug = slugify(role_data["title"])
            if db.query(CareerRole).filter(CareerRole.slug == slug).first():
                continue

            required = role_data.pop("required")
            recommended = role_data.pop("recommended")
            role = CareerRole(slug=slug, **role_data)
            db.add(role)
            db.flush()

            for name in required:
                skill = db.query(Skill).filter(Skill.name == name).first()
                if not skill:
                    skill = Skill(name=name, category=SkillCategory.TECHNICAL)
                    db.add(skill)
                    db.flush()
                db.add(RoleSkill(career_role_id=role.id, skill_id=skill.id, is_required=True))

            for name in recommended:
                skill = db.query(Skill).filter(Skill.name == name).first()
                if not skill:
                    skill = Skill(name=name, category=SkillCategory.TECHNICAL)
                    db.add(skill)
                    db.flush()
                db.add(RoleSkill(career_role_id=role.id, skill_id=skill.id, is_required=False))

            created += 1
        db.commit()
        print(f"[seed_roles] Created {created} new career roles (of {len(ROLES)} total).")


if __name__ == "__main__":
    run()
