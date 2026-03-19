from __future__ import annotations
from datetime import date, datetime

from pydantic import BaseModel


class SettlementCreate(BaseModel):
    group_id: str
    payee_id: str   # user being paid back
    amount: float
    date: date
    note: str | None = None


class SettlementResponse(BaseModel):
    id: str
    group_id: str
    payer_id: str
    payee_id: str
    amount: float
    date: date
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
