from __future__ import annotations
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import UUIDBase

if TYPE_CHECKING:
    from models.expense import Expense
    from models.group_expense import GroupExpense


class Category(UUIDBase):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), nullable=False)   # emoji
    color: Mapped[str] = mapped_column(String(7), nullable=False)   # hex
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # 'expense' | 'income' | 'both'
    category_type: Mapped[str] = mapped_column(String(10), nullable=False, default="expense")

    # NULL for system categories; set for user-created ones
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )

    # Relationships
    expenses: Mapped[list["Expense"]] = relationship("Expense", back_populates="category", lazy="noload")
    group_expenses: Mapped[list["GroupExpense"]] = relationship("GroupExpense", back_populates="category", lazy="noload")
