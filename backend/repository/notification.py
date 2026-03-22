from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.notification import DeviceToken, Notification, NotificationPreference


class NotificationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    # ── Device tokens ─────────────────────────────────────────────────────────

    async def upsert_device_token(
        self,
        user_id: str,
        token: str,
        platform: str,
        device_name: Optional[str] = None,
    ) -> DeviceToken:
        result = await self._s.execute(
            select(DeviceToken).where(
                DeviceToken.user_id == user_id,
                DeviceToken.token == token,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.is_active = True
            existing.platform = platform
            if device_name:
                existing.device_name = device_name
            self._s.add(existing)
            await self._s.flush()
            return existing

        dt = DeviceToken(
            user_id=user_id,
            token=token,
            platform=platform,
            device_name=device_name,
            is_active=True,
        )
        self._s.add(dt)
        await self._s.flush()
        return dt

    async def get_active_tokens_for_user(self, user_id: str) -> list[DeviceToken]:
        result = await self._s.execute(
            select(DeviceToken).where(
                DeviceToken.user_id == user_id,
                DeviceToken.is_active == True,  # noqa: E712
            )
        )
        return list(result.scalars().all())

    async def deactivate_token(self, token: str) -> None:
        result = await self._s.execute(
            select(DeviceToken).where(DeviceToken.token == token)
        )
        dt = result.scalar_one_or_none()
        if dt:
            dt.is_active = False
            self._s.add(dt)
            await self._s.flush()

    # ── Preferences ───────────────────────────────────────────────────────────

    async def get_or_create_preferences(self, user_id: str) -> NotificationPreference:
        result = await self._s.execute(
            select(NotificationPreference).where(
                NotificationPreference.user_id == user_id
            )
        )
        pref = result.scalar_one_or_none()
        if pref:
            return pref
        pref = NotificationPreference(user_id=user_id)
        self._s.add(pref)
        await self._s.flush()
        return pref

    async def update_preferences(
        self, pref: NotificationPreference, **kwargs
    ) -> NotificationPreference:
        for key, value in kwargs.items():
            setattr(pref, key, value)
        self._s.add(pref)
        await self._s.flush()
        await self._s.refresh(pref)
        return pref

    # ── Notification log ──────────────────────────────────────────────────────

    async def log_notification(
        self,
        user_id: str,
        type: str,
        title: str,
        body: str,
        data: dict,
        entity_id: Optional[str] = None,
        sent_at: Optional[datetime] = None,
    ) -> Notification:
        n = Notification(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            data=data,
            entity_id=entity_id,
            sent_at=sent_at or datetime.now(timezone.utc),
        )
        self._s.add(n)
        await self._s.flush()
        return n

    async def find_recent_notification(
        self,
        user_id: str,
        type: str,
        entity_id: str,
        since: datetime,
    ) -> Notification | None:
        result = await self._s.execute(
            select(Notification).where(
                and_(
                    Notification.user_id == user_id,
                    Notification.type == type,
                    Notification.entity_id == entity_id,
                    Notification.sent_at >= since,
                )
            )
        )
        return result.scalar_one_or_none()
