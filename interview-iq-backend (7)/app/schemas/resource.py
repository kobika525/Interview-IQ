from pydantic import BaseModel

from app.schemas.common import ORMModel


class ResourceOut(ORMModel):
    id: int
    title: str
    resource_type: str
    difficulty: str
    url: str | None
    provider: str | None
    description: str | None
    estimated_duration_minutes: int
    is_premium: bool
    is_bookmarked: bool = False
    progress_status: str = "NOT_STARTED"


class ResourceFilter(BaseModel):
    search: str | None = None
    resource_type: str | None = None
    difficulty: str | None = None
    premium_only: bool | None = None
