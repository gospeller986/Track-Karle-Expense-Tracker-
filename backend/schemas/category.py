from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class CategoryResponse(_CamelModel):
    model_config = ConfigDict(
        alias_generator=lambda f: "isDefault" if f == "is_system" else to_camel(f),
        populate_by_name=True,
        from_attributes=True,
    )
    id: str
    name: str
    icon: str
    color: str
    is_system: bool         # → isDefault in JSON
    category_type: str      # → categoryType in JSON  ('expense' | 'income' | 'both')


class CategoryCreate(_CamelModel):
    name: str
    icon: str
    color: str
    category_type: str = "expense"   # → categoryType


class CategoryUpdate(_CamelModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    category_type: Optional[str] = None
