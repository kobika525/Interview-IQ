from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession
from app.repositories.career_repository import CareerRepository
from app.schemas.skill import UserSkillIn
from app.utils.responses import success_response

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get("")
def list_skills(db: DbSession):
    from sqlalchemy import select

    from app.models.skill import Skill

    skills = db.scalars(select(Skill).order_by(Skill.name)).all()
    return success_response([{"id": s.id, "name": s.name, "category": s.category.value} for s in skills])


@router.get("/me")
def list_my_skills(db: DbSession, user: CurrentUser):
    repo = CareerRepository(db)
    rows = repo.get_user_skills(user.id)
    return success_response([
        {"id": r.id, "skill": {"id": r.skill.id, "name": r.skill.name, "category": r.skill.category.value},
         "proficiency": r.proficiency.value, "source": r.source} for r in rows
    ])


@router.post("/me", status_code=201)
def add_my_skill(payload: UserSkillIn, db: DbSession, user: CurrentUser):
    repo = CareerRepository(db)
    skill = repo.get_or_create_skill(payload.name)
    existing = [r for r in repo.get_user_skills(user.id) if r.skill_id == skill.id]
    if not existing:
        repo.add_user_skill(user_id=user.id, skill_id=skill.id, proficiency=payload.proficiency, source="MANUAL")
        db.commit()
    return success_response(None, "Skill added")
