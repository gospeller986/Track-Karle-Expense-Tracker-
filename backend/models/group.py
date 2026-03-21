from __future__ import annotations
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import UUIDBase

if TYPE_CHECKING:
    from models.user import User
    from models.group_expense import GroupExpense
    from models.settlement import Settlement


class Group(UUIDBase):
    __tablename__ = "groups"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), nullable=False, default="👥")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    invite_token: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True, index=True)

    # Relationships
    members: Mapped[list["GroupMember"]] = relationship("GroupMember", back_populates="group", lazy="noload", cascade="all, delete-orphan")
    expenses: Mapped[list["GroupExpense"]] = relationship("GroupExpense", back_populates="group", lazy="noload", cascade="all, delete-orphan")
    settlements: Mapped[list["Settlement"]] = relationship("Settlement", back_populates="group", lazy="noload", cascade="all, delete-orphan")


class GroupMember(UUIDBase):
    __tablename__ = "group_members"

    group_id: Mapped[str] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(
        Enum("admin", "member", name="group_role"), default="member", nullable=False
    )

    # Relationships
    group: Mapped["Group"] = relationship("Group", back_populates="members", lazy="noload")
    user: Mapped["User"] = relationship("User", back_populates="group_memberships", lazy="noload")
