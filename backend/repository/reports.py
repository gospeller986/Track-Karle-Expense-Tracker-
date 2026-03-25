from __future__ import annotations

import calendar
from datetime import date as Date, timedelta

from sqlalchemy import and_, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.category import Category
from models.expense import Expense

MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


class ReportsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_summary(self, user_id: str, year: int, month: int) -> dict:
        first_day = Date(year, month, 1)
        last_day = Date(year, month, calendar.monthrange(year, month)[1])

        # Aggregate income and expenses for the period
        agg_q = (
            select(
                Expense.type,
                func.sum(Expense.amount).label("total"),
                func.count(Expense.id).label("count"),
            )
            .where(
                and_(
                    Expense.user_id == user_id,
                    Expense.date >= first_day,
                    Expense.date <= last_day,
                )
            )
            .group_by(Expense.type)
        )
        rows = (await self.session.execute(agg_q)).all()

        total_income = 0.0
        total_expenses = 0.0
        transaction_count = 0
        for row in rows:
            if row.type == "income":
                total_income = float(row.total or 0)
            elif row.type == "expense":
                total_expenses = float(row.total or 0)
                transaction_count = int(row.count or 0)

        avg_daily = round(total_expenses / last_day.day, 2)

        # Largest single expense
        largest_q = (
            select(Expense.title, Expense.amount)
            .where(
                and_(
                    Expense.user_id == user_id,
                    Expense.type == "expense",
                    Expense.date >= first_day,
                    Expense.date <= last_day,
                )
            )
            .order_by(Expense.amount.desc())
            .limit(1)
        )
        largest_row = (await self.session.execute(largest_q)).first()

        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_balance": total_income - total_expenses,
            "transaction_count": transaction_count,
            "avg_daily_spend": avg_daily,
            "largest_expense": (
                {"title": largest_row.title, "amount": float(largest_row.amount)}
                if largest_row
                else None
            ),
            "year": year,
            "month": month,
        }

    async def get_spending_trend(self, user_id: str, months: int = 6) -> list[dict]:
        today = Date.today()

        # Start of the window = first day of (months-1) months ago
        start_month = today.month - (months - 1)
        start_year = today.year
        while start_month <= 0:
            start_month += 12
            start_year -= 1
        start_date = Date(start_year, start_month, 1)

        yr_expr = extract("year", Expense.date)
        mo_expr = extract("month", Expense.date)
        q = (
            select(
                yr_expr.label("yr"),
                mo_expr.label("mo"),
                Expense.type,
                func.sum(Expense.amount).label("total"),
            )
            .where(and_(Expense.user_id == user_id, Expense.date >= start_date))
            .group_by(yr_expr, mo_expr, Expense.type)
            .order_by(yr_expr, mo_expr)
        )
        rows = (await self.session.execute(q)).all()

        # Pre-populate ordered month buckets
        month_data: dict[tuple[int, int], dict] = {}
        y, m = start_year, start_month
        for _ in range(months):
            month_data[(y, m)] = {
                "month": MONTH_NAMES[m - 1],
                "year": y,
                "total_income": 0.0,
                "total_expenses": 0.0,
            }
            m += 1
            if m > 12:
                m = 1
                y += 1

        for row in rows:
            key = (int(row.yr), int(row.mo))
            if key not in month_data:
                continue
            if row.type == "income":
                month_data[key]["total_income"] = float(row.total or 0)
            elif row.type == "expense":
                month_data[key]["total_expenses"] = float(row.total or 0)

        return list(month_data.values())

    async def get_category_breakdown(
        self, user_id: str, year: int, month: int
    ) -> list[dict]:
        first_day = Date(year, month, 1)
        last_day = Date(year, month, calendar.monthrange(year, month)[1])

        q = (
            select(
                Expense.category_id,
                Category.name,
                Category.icon,
                Category.color,
                func.sum(Expense.amount).label("amount"),
                func.count(Expense.id).label("transaction_count"),
            )
            .join(Category, Expense.category_id == Category.id)
            .where(
                and_(
                    Expense.user_id == user_id,
                    Expense.type == "expense",
                    Expense.date >= first_day,
                    Expense.date <= last_day,
                )
            )
            .group_by(Expense.category_id)
            .order_by(func.sum(Expense.amount).desc())
        )
        rows = (await self.session.execute(q)).all()

        total = sum(float(r.amount or 0) for r in rows)
        return [
            {
                "category_id": r.category_id,
                "name": r.name,
                "icon": r.icon,
                "color": r.color,
                "amount": float(r.amount or 0),
                "percentage": round(float(r.amount or 0) / total * 100, 1) if total > 0 else 0.0,
                "transaction_count": int(r.transaction_count or 0),
            }
            for r in rows
        ]

    async def get_weekly_trend(self, user_id: str, weeks: int = 4) -> list[dict]:
        today = Date.today()

        # Anchor to the most recent Monday (weekday() == 0 means Monday)
        current_week_start = today - timedelta(days=today.weekday())

        # Build week ranges oldest → newest
        week_ranges: list[tuple[Date, Date]] = []
        for i in range(weeks - 1, -1, -1):
            w_start = current_week_start - timedelta(weeks=i)
            w_end = w_start + timedelta(days=6)  # Sunday
            week_ranges.append((w_start, min(w_end, today)))

        oldest_start = week_ranges[0][0]

        # Fetch all expenses in the window in a single query
        q = (
            select(Expense.date, Expense.type, Expense.amount)
            .where(
                and_(
                    Expense.user_id == user_id,
                    Expense.date >= oldest_start,
                    Expense.date <= today,
                )
            )
        )
        rows = (await self.session.execute(q)).all()

        # Pre-populate week buckets
        week_data: list[dict] = []
        for w_start, _ in week_ranges:
            week_data.append({
                "week_start": w_start.isoformat(),
                "label": f"{MONTH_NAMES[w_start.month - 1]} {w_start.day}",
                "total_income": 0.0,
                "total_expenses": 0.0,
            })

        # Bucket each expense into its week
        for row in rows:
            for i, (w_start, w_end) in enumerate(week_ranges):
                if w_start <= row.date <= w_end:
                    if row.type == "income":
                        week_data[i]["total_income"] += float(row.amount or 0)
                    elif row.type == "expense":
                        week_data[i]["total_expenses"] += float(row.amount or 0)
                    break

        return week_data
