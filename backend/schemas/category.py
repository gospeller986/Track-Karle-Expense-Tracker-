from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class CategoryResponse(_CamelModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )
    id: str
    name: str
    icon: str
    color: str
    is_system: bool   # → isDefault in JSON via alias below

    # Override alias so frontend sees "isDefault" matching the README
    model_config = ConfigDict(
        alias_generator=lambda f: "isDefault" if f == "is_system" else to_camel(f),
        populate_by_name=True,
        from_attributes=True,
    )


class CategoryCreate(_CamelModel):
    name: str
    icon: str
    color: str


class CategoryUpdate(_CamelModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
