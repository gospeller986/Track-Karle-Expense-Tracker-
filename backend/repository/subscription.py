from __future__ import annotations

from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.subscription import Subscription
from repository.base import BaseRepository


class SubscriptionRepository(BaseRepository[Subscription]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Subscription, session)

    async def list_for_user(self, user_id: str) -> Sequence[Subscription]:
        result = await self.session.execute(
            select(Subscription)
            .where(Subscription.user_id == user_id, Subscription.is_active.is_(True))
            .order_by(Subscription.next_renewal.asc())
        )
        return result.scalars().all()

    async def get_user_subscription(
        self, subscription_id: str, user_id: str
    ) -> Subscription | None:
        result = await self.session.execute(
            select(Subscription).where(
                Subscription.id == subscription_id,
                Subscription.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
