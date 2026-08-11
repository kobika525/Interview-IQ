from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.interview import (
    AnswerEvaluation, InterviewAnswer, InterviewQuestion, InterviewSession, SessionQuestion,
)


class InterviewRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- Question bank ---
    def find_questions(
        self, career_role_id: int | None, difficulty: str | None, interview_type: str | None,
        categories: list[str] | None, limit: int,
    ) -> list[InterviewQuestion]:
        stmt = select(InterviewQuestion).where(InterviewQuestion.is_active.is_(True))
        if career_role_id:
            stmt = stmt.where(
                (InterviewQuestion.career_role_id == career_role_id) | (InterviewQuestion.career_role_id.is_(None))
            )
        if difficulty:
            stmt = stmt.where(InterviewQuestion.difficulty == difficulty)
        if interview_type and interview_type != "MIXED":
            stmt = stmt.where(InterviewQuestion.interview_type == interview_type)
        if categories:
            stmt = stmt.where(InterviewQuestion.category.in_(categories))
        return self.db.scalars(stmt.order_by(func.random()).limit(limit)).all()

    def count_active_questions(self) -> int:
        return len(self.db.scalars(select(InterviewQuestion).where(InterviewQuestion.is_active.is_(True))).all())

    def create_question(self, **kwargs) -> InterviewQuestion:
        q = InterviewQuestion(**kwargs)
        self.db.add(q)
        self.db.flush()
        return q

    def get_question(self, question_id: int) -> InterviewQuestion | None:
        return self.db.get(InterviewQuestion, question_id)

    def list_questions_admin(self, offset: int, limit: int, filters: dict):
        stmt = select(InterviewQuestion)
        if filters.get("career_role_id"):
            stmt = stmt.where(InterviewQuestion.career_role_id == filters["career_role_id"])
        if filters.get("difficulty"):
            stmt = stmt.where(InterviewQuestion.difficulty == filters["difficulty"])
        if filters.get("interview_type"):
            stmt = stmt.where(InterviewQuestion.interview_type == filters["interview_type"])
        if filters.get("search"):
            stmt = stmt.where(InterviewQuestion.question_text.ilike(f"%{filters['search']}%"))
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.order_by(InterviewQuestion.id.desc()).offset(offset).limit(limit)).all()
        return items, total

    # --- Sessions ---
    def create_session(self, **kwargs) -> InterviewSession:
        session = InterviewSession(**kwargs)
        self.db.add(session)
        self.db.flush()
        return session

    def get_session(self, session_id: int) -> InterviewSession | None:
        return self.db.scalar(
            select(InterviewSession)
            .options(joinedload(InterviewSession.session_questions).joinedload(SessionQuestion.question))
            .options(joinedload(InterviewSession.session_questions).joinedload(SessionQuestion.answer))
            .options(joinedload(InterviewSession.report))
            .where(InterviewSession.id == session_id)
        )

    def list_sessions_for_user(self, user_id: int, offset: int, limit: int, filters: dict):
        stmt = select(InterviewSession).where(InterviewSession.user_id == user_id)
        if filters.get("mode"):
            stmt = stmt.where(InterviewSession.mode == filters["mode"])
        if filters.get("difficulty"):
            stmt = stmt.where(InterviewSession.difficulty == filters["difficulty"])
        if filters.get("status"):
            stmt = stmt.where(InterviewSession.status == filters["status"])
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(
            stmt.options(joinedload(InterviewSession.report))
            .order_by(InterviewSession.created_at.desc()).offset(offset).limit(limit)
        ).all()
        return items, total

    def add_session_question(self, **kwargs) -> SessionQuestion:
        sq = SessionQuestion(**kwargs)
        self.db.add(sq)
        self.db.flush()
        return sq

    def get_session_question(
        self, session_id: int, order_number: int, *, for_update: bool = False,
    ) -> SessionQuestion | None:
        stmt = select(SessionQuestion).where(
            SessionQuestion.session_id == session_id, SessionQuestion.order_number == order_number
        )
        if for_update:
            stmt = stmt.with_for_update()
        return self.db.scalar(stmt)

    def create_answer(self, **kwargs) -> InterviewAnswer:
        answer = InterviewAnswer(**kwargs)
        self.db.add(answer)
        self.db.flush()
        return answer

    def create_evaluation(self, **kwargs) -> AnswerEvaluation:
        evaluation = AnswerEvaluation(**kwargs)
        self.db.add(evaluation)
        self.db.flush()
        return evaluation

    def delete_session(self, session: InterviewSession) -> None:
        self.db.delete(session)
        self.db.flush()
