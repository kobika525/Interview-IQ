from dataclasses import dataclass
from typing import Generic, Sequence, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session, Query

T = TypeVar("T")

MAX_PAGE_SIZE = 100


@dataclass
class PageParams:
    page: int = 1
    page_size: int = 20

    def __post_init__(self):
        self.page = max(1, self.page)
        self.page_size = min(max(1, self.page_size), MAX_PAGE_SIZE)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


@dataclass
class Page(Generic[T]):
    items: Sequence[T]
    page: int
    page_size: int
    total_items: int

    @property
    def total_pages(self) -> int:
        return max(1, -(-self.total_items // self.page_size)) if self.page_size else 1

    @property
    def has_next(self) -> bool:
        return self.page < self.total_pages

    @property
    def has_previous(self) -> bool:
        return self.page > 1

    def to_dict(self) -> dict:
        return {
            "items": self.items,
            "pagination": {
                "page": self.page,
                "page_size": self.page_size,
                "total_items": self.total_items,
                "total_pages": self.total_pages,
                "has_next": self.has_next,
                "has_previous": self.has_previous,
            },
        }


def paginate_query(db: Session, query: Query, params: PageParams) -> Page:
    total_items = query.order_by(None).with_entities(func.count()).select_from(query.subquery()).scalar() or 0
    items = query.offset(params.offset).limit(params.page_size).all()
    return Page(items=items, page=params.page, page_size=params.page_size, total_items=total_items)
