from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class CareerRoleOut(ORMModel):
    id: int
    title: str
    slug: str
    description: str | None
    responsibilities: str | None
    experience_level: str
    demand_level: str
    avg_salary_min: int | None
    avg_salary_max: int | None
    estimated_learning_duration_weeks: int
    required_skills: list[str] = []
    recommended_skills: list[str] = []


class CareerMatchGenerateRequest(BaseModel):
    resume_id: int | None = None
    preferred_industry: str | None = None
    preferred_work_style: str | None = None
    career_goals: str | None = None
    current_skills: list[str] = []
    education_level: str | None = None
    interests: str | None = None
    target_location: str | None = None
    experience_level: str | None = None


class CareerMatchOut(ORMModel):
    id: int
    career_role: CareerRoleOut
    match_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    priority_skills: list[str]
    explanation: str | None
    created_at: datetime


class SkillGapRequest(BaseModel):
    career_role_id: int
    experience_level: str | None = None
    additional_skills: list[str] = []
    resume_id: int | None = None
    education_level: str | None = None
    career_goals: str | None = None
    interests: str | None = None


class SkillGapOut(ORMModel):
    id: int
    career_role_id: int
    readiness_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    priority_gaps: list[str]
    beginner_skills: list[str]
    intermediate_skills: list[str]
    advanced_skills: list[str]
    estimated_prep_weeks: int
    created_at: datetime
    score_breakdown: dict[str, float] = {}
    recommendations: list[str] = []
    evidence_sources: list[str] = []
