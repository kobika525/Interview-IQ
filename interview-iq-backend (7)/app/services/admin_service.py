from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationAppError
from app.models.career import CareerRole
from app.models.interview import InterviewQuestion, InterviewSession
from app.models.report import InterviewReport
from app.models.resource import LearningResource
from app.models.resume import Resume
from app.models.skill import RoleSkill
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.models.user import User
from app.repositories.career_repository import CareerRepository
from app.repositories.interview_repository import InterviewRepository
from app.repositories.roadmap_repository import RoadmapRepository
from app.repositories.subscription_repository import SubscriptionRepository
from app.repositories.support_repository import SupportRepository
from app.repositories.user_repository import UserRepository
from app.utils.datetime import utcnow
from app.utils.slugs import slugify
from app.utils.enums import AccountStatus, InterviewStatus, SubscriptionStatus


class AdminService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.careers = CareerRepository(db)
        self.interviews = InterviewRepository(db)
        self.roadmaps = RoadmapRepository(db)
        self.subscriptions = SubscriptionRepository(db)
        self.support = SupportRepository(db)

    # --- Dashboard / analytics ---
    def dashboard(self) -> dict:
        total_users = len(self.db.scalars(select(User)).all())
        active_users = len(self.db.scalars(select(User).where(User.account_status == AccountStatus.ACTIVE)).all())
        cutoff = utcnow() - timedelta(days=30)
        new_registrations = len(self.db.scalars(select(User).where(User.created_at >= cutoff)).all())
        completed_interviews = len(
            self.db.scalars(select(InterviewSession).where(InterviewSession.status == InterviewStatus.COMPLETED)).all()
        )
        resume_analyses = len(self.db.scalars(select(Resume)).all())
        active_subs = len(
            self.db.scalars(select(UserSubscription).where(UserSubscription.status == SubscriptionStatus.ACTIVE)).all()
        )

        mode_rows = self.db.execute(
            select(InterviewSession.mode, func.count(InterviewSession.id)).group_by(InterviewSession.mode)
        ).all()
        mode_distribution = {mode.value: count for mode, count in mode_rows}

        role_rows = self.db.execute(
            select(CareerRole.title, func.count(InterviewSession.id))
            .join(InterviewSession, InterviewSession.career_role_id == CareerRole.id)
            .group_by(CareerRole.title).order_by(func.count(InterviewSession.id).desc()).limit(5)
        ).all()
        popular_roles = [{"role": title, "count": count} for title, count in role_rows]

        avg_score = self.db.scalar(select(func.avg(InterviewReport.overall_score))) or 0.0

        return {
            "total_users": total_users, "active_users": active_users,
            "new_registrations_last_30_days": new_registrations, "completed_interviews": completed_interviews,
            "resume_analyses": resume_analyses, "active_subscriptions": active_subs,
            "interview_mode_distribution": mode_distribution, "popular_career_roles": popular_roles,
            "average_interview_score": round(float(avg_score), 1),
        }

    # --- Users ---
    def list_users(self, offset: int, limit: int, search: str | None):
        return self.users.list_all(offset, limit, search)

    def get_user(self, user_id: int) -> User:
        user = self.users.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found.")
        return user

    def update_user(self, user_id: int, data: dict) -> User:
        user = self.get_user(user_id)
        if data.get("full_name"):
            user.full_name = data["full_name"]
        if data.get("role"):
            from app.utils.enums import UserRole
            user.role = UserRole(data["role"])
        self.db.commit()
        return user

    def update_user_status(self, user_id: int, status: str) -> User:
        user = self.get_user(user_id)
        try:
            user.account_status = AccountStatus(status)
        except ValueError:
            raise ValidationAppError(f"Invalid account status: {status}")
        self.db.commit()
        return user

    def delete_user(self, user_id: int) -> None:
        user = self.get_user(user_id)
        self.users.delete(user)
        self.db.commit()

    # --- Questions ---
    def list_questions(self, offset: int, limit: int, filters: dict):
        return self.interviews.list_questions_admin(offset, limit, filters)

    def create_question(self, data: dict) -> InterviewQuestion:
        question = self.interviews.create_question(**data)
        self.db.commit()
        return question

    def get_question(self, question_id: int) -> InterviewQuestion:
        question = self.interviews.get_question(question_id)
        if not question:
            raise NotFoundError("Question not found.")
        return question

    def update_question(self, question_id: int, data: dict) -> InterviewQuestion:
        question = self.get_question(question_id)
        for k, v in data.items():
            if v is not None:
                setattr(question, k, v)
        self.db.commit()
        return question

    def delete_question(self, question_id: int) -> None:
        question = self.get_question(question_id)
        self.db.delete(question)
        self.db.commit()

    # --- Career roles ---
    def create_career_role(self, data: dict) -> CareerRole:
        slug = slugify(data["title"])
        if self.careers.get_role_by_slug(slug):
            raise ValidationAppError("A career role with a similar title already exists.")
        required = data.pop("required_skills", [])
        recommended = data.pop("recommended_skills", [])
        role = self.careers.create_role(slug=slug, **data)
        for name in required:
            skill = self.careers.get_or_create_skill(name)
            self.db.add(RoleSkill(career_role_id=role.id, skill_id=skill.id, is_required=True))
        for name in recommended:
            skill = self.careers.get_or_create_skill(name)
            self.db.add(RoleSkill(career_role_id=role.id, skill_id=skill.id, is_required=False))
        self.db.commit()
        return role

    def list_career_roles(self, offset: int, limit: int):
        return self.careers.list_roles(offset, limit, active_only=False)

    def get_career_role(self, role_id: int) -> CareerRole:
        role = self.careers.get_role(role_id)
        if not role:
            raise NotFoundError("Career role not found.")
        return role

    def update_career_role(self, role_id: int, data: dict) -> CareerRole:
        role = self.get_career_role(role_id)
        for k, v in data.items():
            if v is not None and k not in ("required_skills", "recommended_skills"):
                setattr(role, k, v)
        self.db.commit()
        return role

    def delete_career_role(self, role_id: int) -> None:
        role = self.get_career_role(role_id)
        self.db.delete(role)
        self.db.commit()

    # --- Resources ---
    def create_resource(self, data: dict) -> LearningResource:
        skill_name = data.pop("skill_name", None)
        if skill_name:
            skill = self.careers.get_or_create_skill(skill_name)
            data["skill_id"] = skill.id
        resource = LearningResource(**data)
        self.db.add(resource)
        self.db.commit()
        return resource

    def list_resources_admin(self, offset: int, limit: int):
        return self.roadmaps.list_resources_admin(offset, limit)

    def update_resource(self, resource_id: int, data: dict) -> LearningResource:
        resource = self.roadmaps.get_resource(resource_id)
        if not resource:
            raise NotFoundError("Resource not found.")
        skill_name = data.pop("skill_name", None)
        if skill_name:
            skill = self.careers.get_or_create_skill(skill_name)
            data["skill_id"] = skill.id
        for k, v in data.items():
            if v is not None:
                setattr(resource, k, v)
        self.db.commit()
        return resource

    def delete_resource(self, resource_id: int) -> None:
        resource = self.roadmaps.get_resource(resource_id)
        if not resource:
            raise NotFoundError("Resource not found.")
        self.db.delete(resource)
        self.db.commit()

    # --- Subscription plans ---
    def list_plans(self):
        return self.subscriptions.list_plans()

    def create_plan(self, data: dict) -> SubscriptionPlan:
        plan = SubscriptionPlan(**data)
        self.db.add(plan)
        self.db.commit()
        return plan

    def update_plan(self, plan_id: int, data: dict) -> SubscriptionPlan:
        plan = self.db.get(SubscriptionPlan, plan_id)
        if not plan:
            raise NotFoundError("Plan not found.")
        for k, v in data.items():
            if v is not None:
                setattr(plan, k, v)
        self.db.commit()
        return plan

    def list_subscriptions(self, offset: int, limit: int):
        stmt = select(UserSubscription)
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.offset(offset).limit(limit)).all()
        return items, total

    # --- Reports (interviews / resumes) ---
    def interview_reports(self, offset: int, limit: int):
        stmt = select(InterviewReport).order_by(InterviewReport.created_at.desc())
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.offset(offset).limit(limit)).all()
        return items, total

    def resume_reports(self, offset: int, limit: int):
        stmt = select(Resume).order_by(Resume.created_at.desc())
        total = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.offset(offset).limit(limit)).all()
        return items, total

    # --- Support ---
    def list_support_tickets(self, offset: int, limit: int, status: str | None = None):
        return self.support.list_all_admin(offset, limit, status)

    # --- Analytics with date range ---
    def analytics_users(self, start_date=None, end_date=None):
        stmt = select(User.created_at)
        if start_date:
            stmt = stmt.where(User.created_at >= start_date)
        if end_date:
            stmt = stmt.where(User.created_at <= end_date)
        rows = self.db.scalars(stmt).all()
        return {"total": len(rows)}
