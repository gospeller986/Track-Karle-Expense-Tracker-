from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class LargestExpense(_CamelModel):
    title: str
    amount: float


class ReportSummary(_CamelModel):
    total_income: float
    total_expenses: float
    net_balance: float
    transaction_count: int
    avg_daily_spend: float
    largest_expense: Optional[LargestExpense] = None
    year: int
    month: int


class MonthlyTrend(_CamelModel):
    month: str          # "Jan", "Feb", …
    year: int
    total_income: float
    total_expenses: float


class SpendingTrendResponse(_CamelModel):
    data: list[MonthlyTrend]


class CategoryBreakdown(_CamelModel):
    category_id: str
    name: str
    icon: str
    color: str
    amount: float
    percentage: float
    transaction_count: int


class CategoryBreakdownResponse(_CamelModel):
    data: list[CategoryBreakdown]
    year: int
    month: int


class WeeklyTrend(_CamelModel):
    week_start: str     # ISO date e.g. "2026-03-17"
    label: str          # e.g. "Mar 17"
    total_income: float
    total_expenses: float


class WeeklyTrendResponse(_CamelModel):
    data: list[WeeklyTrend]


class HeatmapResponse(_CamelModel):
    active_days: list[str]      # ISO date strings e.g. ["2026-03-01", ...]
    current_streak: int
    longest_streak: int
