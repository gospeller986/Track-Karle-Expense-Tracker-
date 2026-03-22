from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# ── Request schemas ────────────────────────────────────────────────────────────

class RegisterDeviceRequest(_CamelModel):
    token: str
    platform: Literal["ios", "android"]
    device_name: Optional[str] = None


class UpdatePreferencesRequest(_CamelModel):
    group_expense_added: Optional[bool] = None
    settlement_created: Optional[bool] = None
    group_invite: Optional[bool] = None
    subscription_reminders: Optional[bool] = None
    budget_alerts: Optional[bool] = None


# ── Response schemas ───────────────────────────────────────────────────────────

class NotificationPreferencesResponse(_CamelModel):
    group_expense_added: bool
    settlement_created: bool
    group_invite: bool
    subscription_reminders: bool
    budget_alerts: bool
