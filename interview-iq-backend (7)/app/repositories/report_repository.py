from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.report import InterviewReport


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> InterviewReport:
        report = InterviewReport(**kwargs)
        self.db.add(report)
        self.db.flush()
        return report

    def get_by_id(self, report_id: int) -> InterviewReport | None:
        return self.db.get(InterviewReport, report_id)

    def get_by_session(self, session_id: int) -> InterviewReport | None:
        return self.db.scalar(select(InterviewReport).where(InterviewReport.session_id == session_id))

    def list_for_user(self, user_id: int, offset: int, limit: int):
        from app.models.interview import InterviewSession

        stmt = (
            select(InterviewReport)
            .join(InterviewSession, InterviewSession.id == InterviewReport.session_id)
            .where(InterviewSession.user_id == user_id)
            .order_by(InterviewReport.created_at.desc())
        )
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.offset(offset).limit(limit)).all()
        return items, total

    def delete(self, report: InterviewReport) -> None:
        self.db.delete(report)
        self.db.flush()
