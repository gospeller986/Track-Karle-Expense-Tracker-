from __future__ import annotations
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import UUIDBase

if TYPE_CHECKING:
    from models.expense import Expense
    from models.group import GroupMember
    from models.subscription import Subscription
    from models.notification import DeviceToken, Notification, NotificationPreference


class User(UUIDBase):
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # User preferences
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    monthly_budget: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    theme: Mapped[str] = mapped_column(String(20), default="dark", nullable=False)

    # Relationships
    expenses: Mapped[list["Expense"]] = relationship("Expense", back_populates="user", lazy="noload")
    group_memberships: Mapped[list["GroupMember"]] = relationship("GroupMember", back_populates="user", lazy="noload")
    subscriptions: Mapped[list["Subscription"]] = relationship("Subscription", back_populates="user", lazy="noload")
    device_tokens: Mapped[list["DeviceToken"]] = relationship("DeviceToken", back_populates="user", lazy="noload")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user", lazy="noload")
    notification_preferences: Mapped[list["NotificationPreference"]] = relationship("NotificationPreference", back_populates="user", lazy="noload")
