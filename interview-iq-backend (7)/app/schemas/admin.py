from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel
from app.utils.enums import (
    AccountStatus, Difficulty, ExperienceLevel, InterviewType, PlanCode, ResourceType, UserRole,
)


class AdminUserOut(ORMModel):
    id: int
    full_name: str
    email: str
    role: str
    account_status: str
    email_verified: bool
    created_at: datetime


class AdminUserUpdateRequest(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None


class AdminUserStatusRequest(BaseModel):
    account_status: AccountStatus


class AdminQuestionIn(BaseModel):
    question_text: str
    career_role_id: int | None = None
    topic: str
    category: str
    difficulty: Difficulty = Difficulty.BEGINNER
    interview_type: InterviewType = InterviewType.TECHNICAL
    expected_keywords: list[str] = []
    expected_key_points: list[str] = []
    sample_answer: str | None = None
    is_active: bool = True


class AdminQuestionUpdate(BaseModel):
    """All fields optional — used for PATCH, unlike AdminQuestionIn (create)."""
    question_text: str | None = None
    career_role_id: int | None = None
    topic: str | None = None
    category: str | None = None
    difficulty: Difficulty | None = None
    interview_type: InterviewType | None = None
    expected_keywords: list[str] | None = None
    expected_key_points: list[str] | None = None
    sample_answer: str | None = None
    is_active: bool | None = None


class AdminQuestionOut(ORMModel):
    id: int
    question_text: str
    career_role_id: int | None
    topic: str
    category: str
    difficulty: str
    interview_type: str
    expected_keywords: list[str]
    expected_key_points: list[str]
    sample_answer: str | None
    is_active: bool


class AdminCareerRoleIn(BaseModel):
    title: str
    description: str | None = None
    responsibilities: str | None = None
    experience_level: ExperienceLevel = ExperienceLevel.BEGINNER
    demand_level: str = "Medium"
    avg_salary_min: int | None = None
    avg_salary_max: int | None = None
    estimated_learning_duration_weeks: int = 8
    required_skills: list[str] = []
    recommended_skills: list[str] = []
    is_active: bool = True


class AdminCareerRoleUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    responsibilities: str | None = None
    experience_level: ExperienceLevel | None = None
    demand_level: str | None = None
    avg_salary_min: int | None = None
    avg_salary_max: int | None = None
    estimated_learning_duration_weeks: int | None = None
    is_active: bool | None = None


class AdminResourceIn(BaseModel):
    title: str
    skill_name: str | None = None
    resource_type: ResourceType = ResourceType.COURSE
    difficulty: Difficulty = Difficulty.BEGINNER
    url: str | None = None
    provider: str | None = None
    description: str | None = None
    estimated_duration_minutes: int = 60
    is_premium: bool = False
    is_published: bool = True


class AdminResourceUpdate(BaseModel):
    title: str | None = None
    skill_name: str | None = None
    resource_type: ResourceType | None = None
    difficulty: Difficulty | None = None
    url: str | None = None
    provider: str | None = None
    description: str | None = None
    estimated_duration_minutes: int | None = None
    is_premium: bool | None = None
    is_published: bool | None = None


class AdminPlanIn(BaseModel):
    code: PlanCode
    name: str
    price_monthly: float
    price_yearly: float
    resume_scan_limit: int | None
    text_interview_limit: int | None
    voice_interview_limit: int | None
    video_interview_limit: int | None
    report_history_limit: int | None
    roadmap_access: bool = True
    premium_resources: bool = False


class AdminPlanUpdate(BaseModel):
    name: str | None = None
    price_monthly: float | None = None
    price_yearly: float | None = None
    resume_scan_limit: int | None = None
    text_interview_limit: int | None = None
    voice_interview_limit: int | None = None
    video_interview_limit: int | None = None
    report_history_limit: int | None = None
    roadmap_access: bool | None = None
    premium_resources: bool | None = None


class AdminDashboardOut(BaseModel):
    total_users: int
    active_users: int
    new_registrations_last_30_days: int
    completed_interviews: int
    resume_analyses: int
    active_subscriptions: int
    interview_mode_distribution: dict[str, int]
    popular_career_roles: list[dict]
    average_interview_score: float


class AdminAnalyticsRequest(BaseModel):
    start_date: str | None = None
    end_date: str | None = None
    group_by: str = "monthly"
