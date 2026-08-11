from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class ResumeSkillOut(BaseModel):
    name: str
    category: str
    is_missing: bool
    confidence: float


class ResumeAnalysisOut(ORMModel):
    id: int
    resume_id: int
    overall_score: float
    keyword_score: float
    formatting_score: float
    experience_score: float
    education_score: float
    achievement_score: float
    section_completeness_score: float
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]
    sections_detected: dict
    weight_version: str
    created_at: datetime
    skills_found: list[ResumeSkillOut] = []
    missing_skills: list[ResumeSkillOut] = []


class ResumeOut(ORMModel):
    id: int
    original_filename: str
    file_size: int
    mime_type: str
    target_role_id: int | None
    status: str
    created_at: datetime
    latest_analysis: ResumeAnalysisOut | None = None


class ResumeAnalyzeRequest(BaseModel):
    target_role_id: int | None = None
