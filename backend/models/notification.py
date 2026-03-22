from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import UUIDBase

if TYPE_CHECKING:
    from models.user import User


class DeviceToken(UUIDBase):
    """Expo push tokens per user device."""

    __tablename__ = "device_tokens"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token: Mapped[str] = mapped_column(Text, nullable=False)
    platform: Mapped[str] = mapped_column(String(10), nullable=False)  # 'ios' | 'android'
    device_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="device_tokens")


class Notification(UUIDBase):
    """Audit log of every push notification sent."""

    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    entity_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="notifications")


class NotificationPreference(UUIDBase):
    """Per-user notification type preferences. One row per user."""

    __tablename__ = "notification_preferences"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    group_expense_added: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    settlement_created: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    group_invite: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    subscription_reminders: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    budget_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="notification_preferences")