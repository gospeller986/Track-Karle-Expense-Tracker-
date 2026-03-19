from __future__ import annotations
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, field_validator


class SubscriptionCreate(BaseModel):
    name: str
    icon: str
    color: str
    amount: float
    billing_cycle: Literal["monthly", "yearly", "weekly"] = "monthly"
    next_renewal: date
    category: str = "Entertainment"

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be positive")
        return v


class SubscriptionUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    color: str | None = None
    amount: float | None = None
    billing_cycle: Literal["monthly", "yearly", "weekly"] | None = None
    next_renewal: date | None = None
    category: str | None = None
    is_active: bool | None = None


class SubscriptionResponse(BaseModel):
    id: str
    name: str
    icon: str
    color: str
    amount: float
    billing_cycle: str
    next_renewal: date
    category: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
