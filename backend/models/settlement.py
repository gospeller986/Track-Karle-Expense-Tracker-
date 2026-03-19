from __future__ import annotations
from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import UUIDBase

if TYPE_CHECKING:
    from models.group import Group
    from models.user import User


class Settlement(UUIDBase):
    __tablename__ = "settlements"

    group_id: Mapped[str] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    payer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)   # who paid back
    payee_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)   # who received
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    note: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    # Relationships
    group: Mapped["Group"] = relationship("Group", back_populates="settlements", lazy="noload")
    payer: Mapped["User"] = relationship("User", foreign_keys=[payer_id], lazy="noload")
    payee: Mapped["User"] = relationship("User", foreign_keys=[payee_id], lazy="noload")
