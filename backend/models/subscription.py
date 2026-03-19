from __future__ import annotations
from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import UUIDBase

if TYPE_CHECKING:
    from models.user import User


class Subscription(UUIDBase):
    __tablename__ = "subscriptions"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), nullable=False)          # emoji
    color: Mapped[str] = mapped_column(String(7), nullable=False)          # hex brand color
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    billing_cycle: Mapped[str] = mapped_column(
        Enum("monthly", "yearly", "weekly", name="billing_cycle"), nullable=False, default="monthly"
    )
    next_renewal: Mapped[date] = mapped_column(Date, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="Entertainment")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="subscriptions", lazy="noload")
