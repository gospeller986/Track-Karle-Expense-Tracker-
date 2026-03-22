from __future__ import annotations
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# ── Request ────────────────────────────────────────────────────────────────────

class SettlementCreate(_CamelModel):
    payee_id: str      # user being paid back (the creditor)
    amount: float
    date: date
    note: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be positive")
        return v


# ── Response ───────────────────────────────────────────────────────────────────

class SettlementResponse(_CamelModel):
    id: str
    group_id: str
    payer_id: str
    payer_name: str
    payee_id: str
    payee_name: str
    amount: float
    date: date
    note: Optional[str] = None
    created_at: datetime


# ── Debt / balance shapes ──────────────────────────────────────────────────────

class DebtItem(_CamelModel):
    from_user_id: str
    from_user_name: str
    to_user_id: str
    to_user_name: str
    amount: float


class GroupBalanceResponse(_CamelModel):
    your_balance: float
    total_expenses: float
    debts: list[DebtItem]
