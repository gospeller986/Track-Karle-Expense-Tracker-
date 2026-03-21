from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, computed_field
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# ── Embedded shapes ────────────────────────────────────────────────────────────

class GroupMemberEmbed(_CamelModel):
    id: str
    name: str
    avatar_url: Optional[str] = None

    @computed_field  # type: ignore[misc]
    @property
    def initials(self) -> str:
        parts = self.name.split()
        return "".join(p[0].upper() for p in parts[:2]) or "?"


# ── Group responses ────────────────────────────────────────────────────────────

class GroupResponse(_CamelModel):
    id: str
    name: str
    icon: str
    description: Optional[str] = None
    created_by: str
    member_count: int
    your_balance: float
    total_expenses: float
    members: list[GroupMemberEmbed]
    created_at: datetime


class GroupListResponse(_CamelModel):
    data: list[GroupResponse]


# ── Request payloads ───────────────────────────────────────────────────────────

class CreateGroupPayload(_CamelModel):
    name: str
    icon: str = "👥"
    description: Optional[str] = None


class UpdateGroupPayload(_CamelModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None


# ── Invite ─────────────────────────────────────────────────────────────────────

class GroupInviteResponse(_CamelModel):
    invite_token: str
    invite_link: str
    group_id: str
    group_name: str


class JoinGroupPayload(_CamelModel):
    token: str


# ── Friends ────────────────────────────────────────────────────────────────────

class FriendResponse(_CamelModel):
    id: str
    name: str
    avatar_url: Optional[str] = None
    net_balance: float
    shared_groups: int

    @computed_field  # type: ignore[misc]
    @property
    def initials(self) -> str:
        parts = self.name.split()
        return "".join(p[0].upper() for p in parts[:2]) or "?"


class FriendListResponse(_CamelModel):
    data: list[FriendResponse]
