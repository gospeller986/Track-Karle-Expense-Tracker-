from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.settlement import Settlement


class SettlementRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def _load_with_users(self, settlement_id: str) -> Settlement | None:
        result = await self._s.execute(
            select(Settlement)
            .where(Settlement.id == settlement_id)
            .options(
                selectinload(Settlement.payer),
                selectinload(Settlement.payee),
            )
        )
        return result.scalar_one_or_none()

    async def list_for_group(self, group_id: str) -> list[Settlement]:
        result = await self._s.execute(
            select(Settlement)
            .where(Settlement.group_id == group_id)
            .options(
                selectinload(Settlement.payer),
                selectinload(Settlement.payee),
            )
            .order_by(Settlement.date.desc(), Settlement.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(
        self,
        group_id: str,
        payer_id: str,
        payee_id: str,
        amount: float,
        date: date,
        note: str | None,
    ) -> Settlement:
        s = Settlement(
            group_id=group_id,
            payer_id=payer_id,
            payee_id=payee_id,
            amount=amount,
            date=date,
            note=note,
        )
        self._s.add(s)
        await self._s.flush()
        return await self._load_with_users(s.id)  # type: ignore[return-value]
