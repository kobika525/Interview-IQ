from fastapi import APIRouter

from app.dependencies import CurrentAdmin, DbSession, Pagination
from app.schemas.admin import AdminCareerRoleIn, AdminCareerRoleUpdate
from app.services.admin_service import AdminService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/admin/career-roles", tags=["Admin — Career Roles"])


def _out(role) -> dict:
    return {
        "id": role.id, "title": role.title, "slug": role.slug, "description": role.description,
        "responsibilities": role.responsibilities, "experience_level": role.experience_level.value,
        "demand_level": role.demand_level, "is_active": role.is_active,
        "required_skills": [rs.skill.name for rs in role.role_skills if rs.is_required],
        "recommended_skills": [rs.skill.name for rs in role.role_skills if not rs.is_required],
    }


@router.post("", status_code=201)
def create_role(payload: AdminCareerRoleIn, db: DbSession, admin: CurrentAdmin):
    role = AdminService(db).create_career_role(payload.model_dump())
    return success_response(_out(role), "Career role created")


@router.get("")
def list_roles(db: DbSession, admin: CurrentAdmin, pagination: Pagination):
    items, total = AdminService(db).list_career_roles(pagination.offset, pagination.page_size)
    page = Page(items=[_out(r) for r in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/{role_id}")
def get_role(role_id: int, db: DbSession, admin: CurrentAdmin):
    return success_response(_out(AdminService(db).get_career_role(role_id)))


@router.patch("/{role_id}")
def update_role(role_id: int, payload: AdminCareerRoleUpdate, db: DbSession, admin: CurrentAdmin):
    role = AdminService(db).update_career_role(role_id, payload.model_dump(exclude_none=True))
    return success_response(_out(role), "Career role updated")


@router.delete("/{role_id}", status_code=204)
def delete_role(role_id: int, db: DbSession, admin: CurrentAdmin):
    AdminService(db).delete_career_role(role_id)
    return None
