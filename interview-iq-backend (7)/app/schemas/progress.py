from pydantic import BaseModel


class TrendPoint(BaseModel):
    label: str
    overall: float
    technical: float
    communication: float
    grammar: float = 0
    confidence: float = 0


class ActivityPoint(BaseModel):
    label: str
    count: int


class ModeDistributionItem(BaseModel):
    mode: str
    count: int


class AchievementOut(BaseModel):
    code: str
    title: str
    description: str
    icon: str
    earned: bool
    earned_at: str | None = None


class ProgressDashboard(BaseModel):
    total_interviews: int
    average_score: float
    highest_score: float
    current_streak: int
    longest_streak: int
    resume_score_improvement: float
    skill_growth_percentage: float
    career_readiness: float
    roadmap_completion_percentage: float
    score_trend: list[TrendPoint]
    weekly_activity: list[ActivityPoint]
    monthly_activity: list[ActivityPoint]
    mode_distribution: list[ModeDistributionItem]
    achievements: list[AchievementOut]
    latest_interview_score: float
    communication_score: float
    grammar_score: float
    confidence_score: float
    eye_contact_score: float
    body_language_score: float
    skill_breakdown: list[dict]
    voice_metrics: dict
    video_metrics: dict
    ai_feedback: dict
    career_suggestions: list
    improvement_timeline: list[TrendPoint]
