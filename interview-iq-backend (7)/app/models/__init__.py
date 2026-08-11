"""
Import every model module here so Alembic's autogenerate (and Base.metadata)
sees the full schema regardless of which module first imports app.models.
"""
from app.models.user import User, RefreshToken, PasswordResetToken, EmailVerificationToken  # noqa: F401
from app.models.profile import UserProfile  # noqa: F401
from app.models.career import CareerRole, CareerMatch  # noqa: F401
from app.models.skill import Skill, RoleSkill, UserSkill, SkillGapAnalysis  # noqa: F401
from app.models.resume import Resume, ResumeAnalysis, ResumeSkill  # noqa: F401
from app.models.roadmap import LearningRoadmap, RoadmapItem  # noqa: F401
from app.models.resource import LearningResource, UserResourceProgress, ResourceBookmark  # noqa: F401
from app.models.interview import (  # noqa: F401
    InterviewQuestion, InterviewSession, SessionQuestion, InterviewAnswer, AnswerEvaluation,
)
from app.models.report import InterviewReport  # noqa: F401
from app.models.achievement import Achievement, UserAchievement  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.subscription import SubscriptionPlan, UserSubscription, UsageRecord, Invoice, PaymentOrder  # noqa: F401
from app.models.support import SupportTicket, TicketMessage  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401
from app.models.job import ProcessingJob  # noqa: F401
