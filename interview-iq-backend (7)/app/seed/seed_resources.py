from app.database import SessionLocal
from app.models.resource import LearningResource
from app.models.skill import Skill
from app.utils.enums import Difficulty, ResourceType

RESOURCES = [
    dict(title="System Design Interview Fundamentals", skill="System Design", resource_type=ResourceType.COURSE,
         difficulty=Difficulty.INTERMEDIATE, provider="Grokking", estimated_duration_minutes=360, is_premium=True,
         url="https://www.educative.io/courses/grokking-modern-system-design-interview-for-engineers-managers",
         description="Learn core system design patterns used in interviews: load balancing, caching, and data partitioning."),
    dict(title="AWS Developer Associate Prep", skill="AWS", resource_type=ResourceType.COURSE,
         difficulty=Difficulty.INTERMEDIATE, provider="A Cloud Guru", estimated_duration_minutes=600, is_premium=True,
         url="https://skillbuilder.aws/",
         description="Hands-on preparation for the AWS Developer Associate certification."),
    dict(title="Docker & Kubernetes Crash Course", skill="Kubernetes", resource_type=ResourceType.VIDEO,
         difficulty=Difficulty.BEGINNER, provider="YouTube", estimated_duration_minutes=180, is_premium=False,
         url="https://kubernetes.io/docs/tutorials/kubernetes-basics/",
         description="A practical introduction to containers and orchestration."),
    dict(title="Behavioral Interview Question Bank", skill=None, resource_type=ResourceType.INTERVIEW_QUESTIONS,
         difficulty=Difficulty.BEGINNER, provider="Interview IQ", estimated_duration_minutes=60, is_premium=False,
         url="/app/interviews/setup",
         description="50 common behavioural questions with model STAR answers."),
    dict(title="REST API Design Best Practices", skill=None, resource_type=ResourceType.ARTICLE,
         difficulty=Difficulty.INTERMEDIATE, provider="Interview IQ Blog", estimated_duration_minutes=20, is_premium=False,
         url="https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design",
         description="Guidelines for designing clean, versioned, predictable REST APIs."),
    dict(title="SQL Practice: Joins & Indexing", skill="SQL", resource_type=ResourceType.EXERCISE,
         difficulty=Difficulty.INTERMEDIATE, provider="Interview IQ", estimated_duration_minutes=120, is_premium=False,
         url="https://sqlbolt.com/",
         description="Hands-on exercises covering joins, indexing, and query optimisation."),
]


def run():
    with SessionLocal() as db:
        created = 0
        for r in RESOURCES:
            existing = db.query(LearningResource).filter(LearningResource.title == r["title"]).first()
            if existing:
                existing.url = r["url"]
                continue
            skill_id = None
            if r["skill"]:
                skill = db.query(Skill).filter(Skill.name == r["skill"]).first()
                skill_id = skill.id if skill else None
            db.add(LearningResource(
                title=r["title"], skill_id=skill_id, resource_type=r["resource_type"], difficulty=r["difficulty"],
                provider=r["provider"], estimated_duration_minutes=r["estimated_duration_minutes"],
                is_premium=r["is_premium"], description=r["description"], url=r["url"],
            ))
            created += 1
        db.commit()
        print(f"[seed_resources] Created {created} new resources (of {len(RESOURCES)} total).")


if __name__ == "__main__":
    run()
