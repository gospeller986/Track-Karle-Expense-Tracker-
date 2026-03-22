from __future__ import annotations
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# ── Request schemas ────────────────────────────────────────────────────────────

class SplitEntry(_CamelModel):
    user_id: str
    amount: Optional[float] = None
    percentage: Optional[float] = None


class GroupExpenseCreate(_CamelModel):
    category_id: str
    title: str
    amount: float
    date: date
    paid_by: str                                     # user_id who paid
    split_type: Literal["equal", "unequal", "percentage"]
    split_with: list[str]                            # user_ids included in split
    splits: Optional[list[SplitEntry]] = None        # required for unequal / percentage
    note: Optional[str] = None

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


# ── Response schemas ───────────────────────────────────────────────────────────

class GroupExpenseSplitResponse(_CamelModel):
    user_id: str
    user_name: str
    amount: float
    percentage: Optional[float] = None
    is_settled: bool


class GroupExpenseResponse(_CamelModel):
    id: str
    group_id: str
    category_id: str
    paid_by: str
    paid_by_name: str
    title: str
    amount: float
    date: date
    split_type: str
    note: Optional[str] = None
    is_settled: bool
    splits: list[GroupExpenseSplitResponse]
    created_at: datetime


class GroupExpenseListResponse(_CamelModel):
    data: list[GroupExpenseResponse]
