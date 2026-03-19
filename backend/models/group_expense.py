from __future__ import annotations
from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import UUIDBase

if TYPE_CHECKING:
    from models.group import Group
    from models.category import Category
    from models.user import User


class GroupExpense(UUIDBase):
    __tablename__ = "group_expenses"

    group_id: Mapped[str] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"), nullable=False)
    paid_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    split_type: Mapped[str] = mapped_column(
        Enum("equal", "unequal", "percentage", name="split_type"), nullable=False, default="equal"
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_settled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    group: Mapped["Group"] = relationship("Group", back_populates="expenses", lazy="noload")
    category: Mapped["Category"] = relationship("Category", back_populates="group_expenses", lazy="noload")
    payer: Mapped["User"] = relationship("User", foreign_keys=[paid_by], lazy="noload")
    splits: Mapped[list["GroupExpenseSplit"]] = relationship(
        "GroupExpenseSplit", back_populates="expense", lazy="noload", cascade="all, delete-orphan"
    )


class GroupExpenseSplit(UUIDBase):
    __tablename__ = "group_expense_splits"

    expense_id: Mapped[str] = mapped_column(ForeignKey("group_expenses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    percentage: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    is_settled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    expense: Mapped["GroupExpense"] = relationship("GroupExpense", back_populates="splits", lazy="noload")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], lazy="noload")
