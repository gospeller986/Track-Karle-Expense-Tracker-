from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.group_expense import GroupExpense, GroupExpenseSplit
from schemas.group_expense import GroupExpenseCreate


class GroupExpenseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def _load_with_splits(self, expense_id: str) -> GroupExpense | None:
        result = await self._s.execute(
            select(GroupExpense)
            .where(GroupExpense.id == expense_id)
            .options(
                selectinload(GroupExpense.splits).selectinload(GroupExpenseSplit.user),
                selectinload(GroupExpense.payer),
            )
        )
        return result.scalar_one_or_none()

    async def list_for_group(self, group_id: str) -> list[GroupExpense]:
        result = await self._s.execute(
            select(GroupExpense)
            .where(GroupExpense.group_id == group_id)
            .options(
                selectinload(GroupExpense.splits).selectinload(GroupExpenseSplit.user),
                selectinload(GroupExpense.payer),
            )
            .order_by(GroupExpense.date.desc(), GroupExpense.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, expense_id: str) -> GroupExpense | None:
        return await self._load_with_splits(expense_id)

    async def create(
        self,
        group_id: str,
        payload: GroupExpenseCreate,
    ) -> GroupExpense:
        expense = GroupExpense(
            group_id=group_id,
            category_id=payload.category_id,
            paid_by=payload.paid_by,
            title=payload.title,
            amount=payload.amount,
            date=payload.date,
            split_type=payload.split_type,
            note=payload.note,
        )
        self._s.add(expense)
        await self._s.flush()

        # Build splits
        if payload.split_type == "equal":
            included = payload.split_with
            per_person = payload.amount / len(included) if included else 0
            splits = [
                GroupExpenseSplit(
                    expense_id=expense.id,
                    user_id=uid,
                    amount=per_person,
                    percentage=None,
                )
                for uid in included
            ]
        elif payload.split_type == "unequal":
            splits = [
                GroupExpenseSplit(
                    expense_id=expense.id,
                    user_id=s.user_id,
                    amount=s.amount or 0,
                    percentage=None,
                )
                for s in (payload.splits or [])
            ]
        else:  # percentage
            splits = [
                GroupExpenseSplit(
                    expense_id=expense.id,
                    user_id=s.user_id,
                    amount=round(payload.amount * (s.percentage or 0) / 100, 2),
                    percentage=s.percentage,
                )
                for s in (payload.splits or [])
            ]

        for split in splits:
            self._s.add(split)
        await self._s.flush()

        return await self._load_with_splits(expense.id)  # type: ignore[return-value]

    async def delete(self, expense_id: str) -> None:
        expense = await self._s.get(GroupExpense, expense_id)
        if expense:
            await self._s.delete(expense)
            await self._s.flush()
