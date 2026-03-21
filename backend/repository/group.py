from __future__ import annotations

import secrets
from typing import Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.group import Group, GroupMember
from models.group_expense import GroupExpense, GroupExpenseSplit
from models.user import User


class GroupRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _load_group_with_members(self, group_id: str) -> Group | None:
        result = await self._s.execute(
            select(Group)
            .where(Group.id == group_id)
            .options(selectinload(Group.members).selectinload(GroupMember.user))
        )
        return result.scalar_one_or_none()

    # ── Queries ───────────────────────────────────────────────────────────────

    async def get_by_id(self, group_id: str) -> Group | None:
        return await self._load_group_with_members(group_id)

    async def get_by_invite_token(self, token: str) -> Group | None:
        result = await self._s.execute(
            select(Group)
            .where(Group.invite_token == token)
            .options(selectinload(Group.members).selectinload(GroupMember.user))
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: str) -> list[Group]:
        # Groups where the user is a member
        result = await self._s.execute(
            select(Group)
            .join(GroupMember, GroupMember.group_id == Group.id)
            .where(GroupMember.user_id == user_id)
            .options(selectinload(Group.members).selectinload(GroupMember.user))
            .order_by(Group.created_at.desc())
        )
        return list(result.scalars().all())

    async def is_member(self, group_id: str, user_id: str) -> bool:
        result = await self._s.execute(
            select(GroupMember.id)
            .where(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
        )
        return result.scalar_one_or_none() is not None

    # ── Mutations ─────────────────────────────────────────────────────────────

    async def create(
        self, *, user_id: str, name: str, icon: str, description: Optional[str]
    ) -> Group:
        token = secrets.token_urlsafe(32)
        group = Group(
            name=name,
            icon=icon,
            description=description,
            created_by=user_id,
            invite_token=token,
        )
        self._s.add(group)
        await self._s.flush()

        member = GroupMember(group_id=group.id, user_id=user_id, role="admin")
        self._s.add(member)
        await self._s.flush()

        return await self._load_group_with_members(group.id)  # type: ignore[return-value]

    async def update(self, group_id: str, **fields) -> Group | None:
        group = await self._load_group_with_members(group_id)
        if not group:
            return None
        for k, v in fields.items():
            if v is not None:
                setattr(group, k, v)
        await self._s.flush()
        return group

    async def delete(self, group_id: str) -> None:
        await self._s.execute(delete(Group).where(Group.id == group_id))

    async def add_member(self, group_id: str, user_id: str) -> GroupMember:
        member = GroupMember(group_id=group_id, user_id=user_id, role="member")
        self._s.add(member)
        await self._s.flush()
        return member

    async def generate_invite_token(self, group_id: str) -> str:
        token = secrets.token_urlsafe(32)
        result = await self._s.execute(select(Group).where(Group.id == group_id))
        group = result.scalar_one_or_none()
        if group:
            group.invite_token = token
            await self._s.flush()
        return token

    # ── Balance computation ───────────────────────────────────────────────────

    async def compute_balance(self, group_id: str, user_id: str) -> tuple[float, float]:
        """Returns (your_balance, total_expenses). Positive balance = owed to you."""
        result = await self._s.execute(
            select(GroupExpense)
            .where(GroupExpense.group_id == group_id)
            .options(selectinload(GroupExpense.splits))
        )
        expenses = result.scalars().all()

        total = sum(float(e.amount) for e in expenses)
        balance = 0.0
        for exp in expenses:
            if exp.paid_by == user_id:
                balance += float(exp.amount)
            for split in exp.splits:
                if split.user_id == user_id and not split.is_settled:
                    balance -= float(split.amount)
        return round(balance, 2), round(total, 2)

    # ── Friends (implicit: co-members across groups) ──────────────────────────

    async def get_friends(self, user_id: str) -> list[tuple[User, int]]:
        """
        Returns list of (User, shared_group_count) for all users who share
        at least one group with the caller.
        """
        # Subquery: group_ids where I am a member
        my_groups = (
            select(GroupMember.group_id)
            .where(GroupMember.user_id == user_id)
            .scalar_subquery()
        )
        result = await self._s.execute(
            select(User, func.count(GroupMember.group_id).label("shared_groups"))
            .join(GroupMember, GroupMember.user_id == User.id)
            .where(GroupMember.group_id.in_(my_groups), User.id != user_id)
            .group_by(User.id)
            .order_by(User.name)
        )
        return [(row.User, row.shared_groups) for row in result.all()]
