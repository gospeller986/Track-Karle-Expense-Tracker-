from __future__ import annotations
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import UUIDBase

if TYPE_CHECKING:
    from models.expense import Expense
    from models.group import GroupMember
    from models.subscription import Subscription


class User(UUIDBase):
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    expenses: Mapped[list["Expense"]] = relationship("Expense", back_populates="user", lazy="noload")
    group_memberships: Mapped[list["GroupMember"]] = relationship("GroupMember", back_populates="user", lazy="noload")
    subscriptions: Mapped[list["Subscription"]] = relationship("Subscription", back_populates="user", lazy="noload")
