from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class RoadmapGenerateRequest(BaseModel):
    career_role_id: int
    skill_gap_analysis_id: int | None = None
    weekly_learning_goal_hours: int | None = None


class RoadmapItemOut(ORMModel):
    id: int
    title: str
    description: str | None
    item_type: str
    difficulty: str
    order_number: int
    estimated_hours: int
    resource_id: int | None
    is_premium_only: bool
    is_completed: bool
    completed_at: datetime | None


class RoadmapOut(ORMModel):
    id: int
    title: str
    status: str
    estimated_duration_weeks: int
    completion_percentage: float
    career_role_id: int | None
    created_at: datetime
    items: list[RoadmapItemOut] = []


class RoadmapItemUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    order_number: int | None = None
