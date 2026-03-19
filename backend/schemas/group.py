from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel

from schemas.user import UserResponse


class GroupCreate(BaseModel):
    name: str
    icon: str = "👥"
    description: str | None = None


class GroupUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    description: str | None = None


class GroupMemberResponse(BaseModel):
    id: str
    user: UserResponse
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class GroupResponse(BaseModel):
    id: str
    name: str
    icon: str
    description: str | None
    created_by: str
    member_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AddMembersRequest(BaseModel):
    user_ids: list[str]
