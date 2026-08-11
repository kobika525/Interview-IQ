from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession, Pagination
from app.schemas.career import (
    CareerMatchGenerateRequest, CareerRoleOut, SkillGapOut, SkillGapRequest,
)
from app.services.career_service import CareerService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/careers", tags=["Careers"])


def _role_out(role) -> dict:
    return CareerRoleOut.model_validate(role).model_dump(mode="json") | {
        "experience_level": role.experience_level.value,
        "required_skills": [rs.skill.name for rs in role.role_skills if rs.is_required],
        "recommended_skills": [rs.skill.name for rs in role.role_skills if not rs.is_required],
    }


def _match_out(match) -> dict:
    payload = {
        "id": match.id, "career_role": _role_out(match.career_role), "match_score": match.match_score,
        "matched_skills": match.matched_skills, "missing_skills": match.missing_skills,
        "priority_skills": match.priority_skills, "explanation": match.explanation, "created_at": match.created_at,
    }
    if hasattr(match, "score_breakdown"):
        payload["score_breakdown"] = match.score_breakdown
    if hasattr(match, "evidence_sources"):
        payload["evidence_sources"] = match.evidence_sources
    return payload


def _gap_out(gap) -> dict:
    if isinstance(gap, dict):
        return gap
    return SkillGapOut.model_validate(gap).model_dump(mode="json")


@router.get("/roles")
def list_roles(db: DbSession, pagination: Pagination):
    items, total = CareerService(db).list_roles(pagination.offset, pagination.page_size)
    page = Page(items=[_role_out(r) for r in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/roles/{role_id}")
def get_role(role_id: int, db: DbSession):
    role = CareerService(db).get_role(role_id)
    return success_response(_role_out(role))


@router.post("/matches/generate", status_code=201)
def generate_matches(payload: CareerMatchGenerateRequest, db: DbSession, user: CurrentUser):
    matches = CareerService(db).generate_matches(user, payload)
    return success_response([_match_out(m) for m in matches], "Career matches generated")


@router.get("/matches")
def list_matches(db: DbSession, user: CurrentUser, pagination: Pagination):
    items, total = CareerService(db).list_matches(user, pagination.offset, pagination.page_size)
    page = Page(items=[_match_out(m) for m in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/matches/{match_id}")
def get_match(match_id: int, db: DbSession, user: CurrentUser):
    match = CareerService(db).get_match(user, match_id)
    return success_response(_match_out(match))


@router.post("/skill-gap", status_code=201)
def create_skill_gap(payload: SkillGapRequest, db: DbSession, user: CurrentUser):
    gap = CareerService(db).analyze_skill_gap(user, payload)
    return success_response(_gap_out(gap), "Skill gap analysis generated")


@router.get("/skill-gap")
def list_skill_gaps(db: DbSession, user: CurrentUser, pagination: Pagination):
    items, total = CareerService(db).list_skill_gaps(user, pagination.offset, pagination.page_size)
    page = Page(items=[_gap_out(g) for g in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/skill-gap/{analysis_id}")
def get_skill_gap(analysis_id: int, db: DbSession, user: CurrentUser):
    gap = CareerService(db).get_skill_gap(user, analysis_id)
    return success_response(_gap_out(gap))
