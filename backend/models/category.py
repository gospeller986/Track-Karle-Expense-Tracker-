from __future__ import annotations
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
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
    is_system: Mapped[bool] = mapped_column(Boolean, default=True)  # false = user-created

    # Relationships
    expenses: Mapped[list["Expense"]] = relationship("Expense", back_populates="category", lazy="noload")
    group_expenses: Mapped[list["GroupExpense"]] = relationship("GroupExpense", back_populates="category", lazy="noload")
