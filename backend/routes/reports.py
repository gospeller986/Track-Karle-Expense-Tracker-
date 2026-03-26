from __future__ import annotations

from datetime import date as Date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from repository.reports import ReportsRepository
from routes.auth import get_current_user
from schemas.reports import (
    CategoryBreakdown,
    CategoryBreakdownResponse,
    HeatmapResponse,
    LargestExpense,
    MonthlyTrend,
    ReportSummary,
    SpendingTrendResponse,
    WeeklyTrend,
    WeeklyTrendResponse,
)

router = APIRouter()


# ── GET /reports/summary ───────────────────────────────────────────────────────

@router.get("/summary", response_model=ReportSummary, response_model_by_alias=True)
async def get_summary(
    year: Optional[int] = Query(default=None),
    month: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportSummary:
    today = Date.today()
    year = year or today.year
    month = month or today.month

    repo = ReportsRepository(db)
    data = await repo.get_summary(current_user.id, year, month)

    largest = (
        LargestExpense(**data["largest_expense"])
        if data["largest_expense"]
        else None
    )
    return ReportSummary(
        total_income=data["total_income"],
        total_expenses=data["total_expenses"],
        net_balance=data["net_balance"],
        transaction_count=data["transaction_count"],
        avg_daily_spend=data["avg_daily_spend"],
        largest_expense=largest,
        year=data["year"],
        month=data["month"],
    )


# ── GET /reports/spending-trend ────────────────────────────────────────────────

@router.get("/spending-trend", response_model=SpendingTrendResponse, response_model_by_alias=True)
async def get_spending_trend(
    months: int = Query(default=6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SpendingTrendResponse:
    repo = ReportsRepository(db)
    data = await repo.get_spending_trend(current_user.id, months)
    return SpendingTrendResponse(data=[MonthlyTrend(**d) for d in data])


# ── GET /reports/weekly-trend ─────────────────────────────────────────────────

@router.get("/weekly-trend", response_model=WeeklyTrendResponse, response_model_by_alias=True)
async def get_weekly_trend(
    weeks: int = Query(default=4, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WeeklyTrendResponse:
    repo = ReportsRepository(db)
    data = await repo.get_weekly_trend(current_user.id, weeks)
    return WeeklyTrendResponse(data=[WeeklyTrend(**d) for d in data])


# ── GET /reports/category-breakdown ───────────────────────────────────────────

@router.get("/category-breakdown", response_model=CategoryBreakdownResponse, response_model_by_alias=True)
async def get_category_breakdown(
    year: Optional[int] = Query(default=None),
    month: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryBreakdownResponse:
    today = Date.today()
    year = year or today.year
    month = month or today.month

    repo = ReportsRepository(db)
    data = await repo.get_category_breakdown(current_user.id, year, month)
    return CategoryBreakdownResponse(
        data=[CategoryBreakdown(**d) for d in data],
        year=year,
        month=month,
    )


# ── GET /reports/heatmap ───────────────────────────────────────────────────────

@router.get("/heatmap", response_model=HeatmapResponse, response_model_by_alias=True)
async def get_heatmap(
    days: int = Query(default=84, ge=28, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HeatmapResponse:
    repo = ReportsRepository(db)
    data = await repo.get_heatmap(current_user.id, days)
    return HeatmapResponse(**data)
