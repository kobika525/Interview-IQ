from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool


class PaginatedData(BaseModel, Generic[T]):
    items: list[T]
    pagination: PaginationMeta


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None


class ErrorDetail(BaseModel):
    code: str
    details: list[Any] = []


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: ErrorDetail
    request_id: Optional[str] = None


class MessageOnly(BaseModel):
    detail: str
