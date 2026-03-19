from __future__ import annotations
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, field_validator


class ExpenseCreate(BaseModel):
    category_id: str
    title: str
    amount: float
    type: Literal["expense", "income"]
    date: date
    note: str | None = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be positive")
        return v


class ExpenseUpdate(BaseModel):
    category_id: str | None = None
    title: str | None = None
    amount: float | None = None
    type: Literal["expense", "income"] | None = None
    date: date | None = None
    note: str | None = None


class ExpenseResponse(BaseModel):
    id: str
    user_id: str
    category_id: str
    title: str
    amount: float
    type: str
    date: date
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
