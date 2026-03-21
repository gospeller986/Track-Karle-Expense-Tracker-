from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# ── Embedded category returned inside each expense ────────────────────────────

class CategoryEmbed(_CamelModel):
    id: str
    name: str
    icon: str
    color: str


# ── Request schemas ────────────────────────────────────────────────────────────

class ExpenseCreate(_CamelModel):
    title: str
    amount: float
    type: Literal["expense", "income"]
    category_id: str
    date: date
    note: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class ExpenseUpdate(_CamelModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[Literal["expense", "income"]] = None
    category_id: Optional[str] = None
    date: Optional[date] = None
    note: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


# ── Response schemas ───────────────────────────────────────────────────────────

class ExpenseResponse(_CamelModel):
    id: str
    title: str
    amount: float
    type: str
    category_id: str
    category: Optional[CategoryEmbed] = None
    date: date
    note: Optional[str] = None
    created_at: datetime


class ExpensePaginationMeta(_CamelModel):
    page: int
    limit: int
    total: int
    total_pages: int


class ExpenseListResponse(_CamelModel):
    data: list[ExpenseResponse]
    pagination: ExpensePaginationMeta
