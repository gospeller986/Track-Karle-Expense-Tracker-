from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


def _alias(field: str) -> str:
    """billing_cycle → cycle, everything else → camelCase."""
    if field == "billing_cycle":
        return "cycle"
    return to_camel(field)


class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=_alias,
        populate_by_name=True,
        from_attributes=True,
    )


# ── Request schemas ────────────────────────────────────────────────────────────

class SubscriptionCreate(_CamelModel):
    name: str
    icon: str
    color: str
    amount: float
    billing_cycle: Literal["monthly", "yearly", "weekly"] = "monthly"
    next_renewal: date
    category: str = "Entertainment"

    @field_validator("amount")
    @classmethod
    def amount_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("amount must be >= 0")
        return v


class SubscriptionUpdate(_CamelModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    amount: Optional[float] = None
    billing_cycle: Optional[Literal["monthly", "yearly", "weekly"]] = None
    next_renewal: Optional[date] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


# ── Response schemas ───────────────────────────────────────────────────────────

class SubscriptionResponse(_CamelModel):
    id: str
    name: str
    icon: str
    color: str
    amount: float
    billing_cycle: str      # serialised as "cycle" via alias
    next_renewal: date
    category: str
    is_active: bool
    created_at: datetime


class SubscriptionSummary(_CamelModel):
    monthly_total: float
    yearly_total: float
    count: int


class SubscriptionListResponse(_CamelModel):
    data: list[SubscriptionResponse]
    summary: SubscriptionSummary
