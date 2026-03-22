from __future__ import annotations

import secrets
from typing import Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.group import Group, GroupMember
from models.group_expense import GroupExpense, GroupExpenseSplit
from models.settlement import Settlement
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
        """Returns (your_balance, total_expenses). Positive balance = group owes you."""
        exp_result = await self._s.execute(
            select(GroupExpense)
            .where(GroupExpense.group_id == group_id)
            .options(selectinload(GroupExpense.splits))
        )
        expenses = exp_result.scalars().all()

        total = sum(float(e.amount) for e in expenses)
        balance = 0.0
        for exp in expenses:
            if exp.paid_by == user_id:
                balance += float(exp.amount)
            for split in exp.splits:
                if split.user_id == user_id:
                    balance -= float(split.amount)

        # Adjust for settlements
        set_result = await self._s.execute(
            select(Settlement).where(Settlement.group_id == group_id)
        )
        for s in set_result.scalars().all():
            if s.payer_id == user_id:
                balance += float(s.amount)   # paid back debt → net goes up
            elif s.payee_id == user_id:
                balance -= float(s.amount)   # received payment → net goes down

        return balance, total

    async def compute_pairwise_balances(
        self, group_id: str, member_ids: list[str], member_names: dict[str, str]
    ) -> list[dict]:
        """
        Returns minimal set of debts: [{ from_user_id, from_user_name, to_user_id, to_user_name, amount }].
        Uses debt-minimization (Splitwise algorithm).
        """
        # Build net position for each member: positive = owed to them, negative = they owe
        net: dict[str, float] = {uid: 0.0 for uid in member_ids}

        exp_result = await self._s.execute(
            select(GroupExpense)
            .where(GroupExpense.group_id == group_id)
            .options(selectinload(GroupExpense.splits))
        )
        for exp in exp_result.scalars().all():
            if exp.paid_by in net:
                net[exp.paid_by] += float(exp.amount)
            for split in exp.splits:
                if split.user_id in net:
                    net[split.user_id] -= float(split.amount)

        set_result = await self._s.execute(
            select(Settlement).where(Settlement.group_id == group_id)
        )
        for s in set_result.scalars().all():
            if s.payer_id in net:
                net[s.payer_id] += float(s.amount)
            if s.payee_id in net:
                net[s.payee_id] -= float(s.amount)

        # Debt minimization: greedy match biggest debtor ↔ biggest creditor
        debtors  = sorted([(uid, v) for uid, v in net.items() if v < -0.01], key=lambda x: x[1])
        creditors = sorted([(uid, v) for uid, v in net.items() if v > 0.01], key=lambda x: -x[1])

        debts: list[dict] = []
        i, j = 0, 0
        debtors  = [list(d) for d in debtors]   # make mutable
        creditors = [list(c) for c in creditors]

        while i < len(debtors) and j < len(creditors):
            debtor_id, debt     = debtors[i]
            creditor_id, credit = creditors[j]
            amount = min(abs(debt), credit)
            debts.append({
                "from_user_id":   debtor_id,
                "from_user_name": member_names.get(debtor_id, debtor_id),
                "to_user_id":     creditor_id,
                "to_user_name":   member_names.get(creditor_id, creditor_id),
                "amount":         amount,
            })
            debtors[i][1]  = debt + amount
            creditors[j][1] = credit - amount
            if abs(debtors[i][1]) < 0.01:
                i += 1
            if abs(creditors[j][1]) < 0.01:
                j += 1

        return debts

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
