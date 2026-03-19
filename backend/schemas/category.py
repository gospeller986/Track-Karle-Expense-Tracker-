from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    icon: str
    color: str


class CategoryResponse(BaseModel):
    id: str
    name: str
    icon: str
    color: str
    is_system: bool
    created_at: datetime

    model_config = {"from_attributes": True}
