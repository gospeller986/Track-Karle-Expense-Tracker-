from __future__ import annotations
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, field_validator, model_validator


class SplitEntry(BaseModel):
    user_id: str
    amount: float | None = None
    percentage: float | None = None


class GroupExpenseCreate(BaseModel):
    category_id: str
    title: str
    amount: float
    date: date
    split_type: Literal["equal", "unequal", "percentage"]
    split_with: list[str]                # user_ids to split with
    splits: list[SplitEntry] | None = None
    note: str | None = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be positive")
        return v

    @model_validator(mode="after")
    def validate_splits(self) -> "GroupExpenseCreate":
        if self.split_type == "unequal":
            if not self.splits:
                raise ValueError("splits required for unequal split")
            total = sum(s.amount or 0 for s in self.splits)
            if abs(total - self.amount) > 0.01:
                raise ValueError(f"split amounts must sum to {self.amount}")
        if self.split_type == "percentage":
            if not self.splits:
                raise ValueError("splits required for percentage split")
            total_pct = sum(s.percentage or 0 for s in self.splits)
            if abs(total_pct - 100) > 0.01:
                raise ValueError("split percentages must sum to 100")
        return self


class GroupExpenseSplitResponse(BaseModel):
    user_id: str
    amount: float
    percentage: float | None
    is_settled: bool

    model_config = {"from_attributes": True}


class GroupExpenseResponse(BaseModel):
    id: str
    group_id: str
    category_id: str
    paid_by: str
    title: str
    amount: float
    date: date
    split_type: str
    note: str | None
    is_settled: bool
    splits: list[GroupExpenseSplitResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
