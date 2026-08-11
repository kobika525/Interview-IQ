from fastapi import APIRouter

from app.dependencies import CurrentAdmin, DbSession, Pagination
from app.schemas.admin import AdminQuestionIn, AdminQuestionOut, AdminQuestionUpdate
from app.services.admin_service import AdminService
from app.utils.pagination import Page
from app.utils.responses import list_response, success_response

router = APIRouter(prefix="/admin/questions", tags=["Admin — Questions"])


def _out(q) -> dict:
    return AdminQuestionOut.model_validate(q).model_dump(mode="json") | {
        "difficulty": q.difficulty.value, "interview_type": q.interview_type.value,
    }


@router.post("", status_code=201)
def create_question(payload: AdminQuestionIn, db: DbSession, admin: CurrentAdmin):
    question = AdminService(db).create_question(payload.model_dump())
    return success_response(_out(question), "Question created")


@router.get("")
def list_questions(
    db: DbSession, admin: CurrentAdmin, pagination: Pagination,
    career_role_id: int | None = None, difficulty: str | None = None, interview_type: str | None = None, search: str | None = None,
):
    items, total = AdminService(db).list_questions(
        pagination.offset, pagination.page_size,
        {"career_role_id": career_role_id, "difficulty": difficulty, "interview_type": interview_type, "search": search},
    )
    page = Page(items=[_out(q) for q in items], page=pagination.page, page_size=pagination.page_size, total_items=total)
    return list_response(page)


@router.get("/{question_id}")
def get_question(question_id: int, db: DbSession, admin: CurrentAdmin):
    return success_response(_out(AdminService(db).get_question(question_id)))


@router.patch("/{question_id}")
def update_question(question_id: int, payload: AdminQuestionUpdate, db: DbSession, admin: CurrentAdmin):
    question = AdminService(db).update_question(question_id, payload.model_dump(exclude_none=True))
    return success_response(_out(question), "Question updated")


@router.delete("/{question_id}", status_code=204)
def delete_question(question_id: int, db: DbSession, admin: CurrentAdmin):
    AdminService(db).delete_question(question_id)
    return None
