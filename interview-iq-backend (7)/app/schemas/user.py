from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.common import ORMModel


class ProfileOut(ORMModel):
    id: int
    bio: str | None
    location: str | None
    degree: str | None
    institute: str | None
    study_level: str | None
    target_career_role_id: int | None
    career_goal: str | None
    preferred_interview_mode: str | None
    weekly_learning_goal_hours: int | None
    onboarding_completed: bool
    onboarding_step: int
    avatar_path: str | None


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    bio: str | None = None
    location: str | None = None
    degree: str | None = None
    institute: str | None = None
    study_level: str | None = None
    target_career_role_id: int | None = None
    career_goal: str | None = None
    preferred_interview_mode: str | None = None
    weekly_learning_goal_hours: int | None = None


class OnboardingRequest(BaseModel):
    career_goal: str | None = None
    study_level: str | None = None
    target_career_role_id: int | None = None
    skills: list[str] = []
    preferred_interview_mode: str | None = None
    weekly_learning_goal_hours: int | None = None
    step: int = 0


class OnboardingOut(BaseModel):
    step: int
    completed: bool
    career_goal: str | None
    study_level: str | None
    target_career_role_id: int | None
    preferred_interview_mode: str | None
    weekly_learning_goal_hours: int | None
