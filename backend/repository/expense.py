from __future__ import annotations

import math
from datetime import date as Date
from typing import Optional, Sequence

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.expense import Expense
from repository.base import BaseRepository


class ExpenseRepository(BaseRepository[Expense]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Expense, session)

    async def list_for_user(
        self,
        user_id: str,
        *,
        page: int = 1,
        limit: int = 20,
        type_filter: Optional[str] = None,
        category_id: Optional[str] = None,
        start_date: Optional[Date] = None,
        end_date: Optional[Date] = None,
        search: Optional[str] = None,
    ) -> tuple[Sequence[Expense], int]:
        filters = [Expense.user_id == user_id]

        if type_filter:
            filters.append(Expense.type == type_filter)
        if category_id:
            filters.append(Expense.category_id == category_id)
        if start_date:
            filters.append(Expense.date >= start_date)
        if end_date:
            filters.append(Expense.date <= end_date)
        if search:
            filters.append(
                or_(
                    Expense.title.ilike(f"%{search}%"),
                    Expense.note.ilike(f"%{search}%"),
                )
            )

        where = and_(*filters)

        count_q = select(func.count()).select_from(Expense).where(where)
        total = (await self.session.execute(count_q)).scalar_one()

        q = (
            select(Expense)
            .where(where)
            .options(selectinload(Expense.category))
            .order_by(Expense.date.desc(), Expense.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        rows = (await self.session.execute(q)).scalars().all()
        return rows, total

    async def get_user_expense(
        self, expense_id: str, user_id: str
    ) -> Expense | None:
        result = await self.session.execute(
            select(Expense)
            .where(Expense.id == expense_id, Expense.user_id == user_id)
            .options(selectinload(Expense.category))
        )
        return result.scalar_one_or_none()
