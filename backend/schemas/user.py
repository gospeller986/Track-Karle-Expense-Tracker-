from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


# ── Response ───────────────────────────────────────────────────────────────────

class UserProfileResponse(_CamelModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

    id: str
    name: str
    email: str
    currency: str
    monthly_budget: Optional[float]
    notifications_enabled: bool
    theme: str
    created_at: datetime


# Backward-compat alias used by schemas.group
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime


# ── Requests ───────────────────────────────────────────────────────────────────

class UpdateProfileRequest(_CamelModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    monthly_budget: Optional[float] = None
    notifications_enabled: Optional[bool] = None
    theme: Optional[str] = None
