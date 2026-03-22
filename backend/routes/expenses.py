from __future__ import annotations

import math
from datetime import date as Date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from repository.expense import ExpenseRepository
from routes.auth import get_current_user
from schemas.expense import (
    ExpenseCreate,
    ExpenseListResponse,
    ExpensePaginationMeta,
    ExpenseResponse,
    ExpenseUpdate,
)

router = APIRouter()


# ── GET /expenses ──────────────────────────────────────────────────────────────

@router.get("", response_model=ExpenseListResponse, response_model_by_alias=True)
async def list_expenses(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    type: Optional[str] = Query(default=None),
    categoryId: Optional[str] = Query(default=None),
    startDate: Optional[Date] = Query(default=None),
    endDate: Optional[Date] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseListResponse:
    repo = ExpenseRepository(db)
    expenses, total = await repo.list_for_user(
        current_user.id,
        page=page,
        limit=limit,
        type_filter=type,
        category_id=categoryId,
        start_date=startDate,
        end_date=endDate,
        search=search,
    )
    total_pages = math.ceil(total / limit) if total > 0 else 0
    return ExpenseListResponse(
        data=[ExpenseResponse.model_validate(e) for e in expenses],
        pagination=ExpensePaginationMeta(
            page=page, limit=limit, total=total, total_pages=total_pages
        ),
    )


# ── POST /expenses ─────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ExpenseResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_expense(
    body: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseResponse:
    repo = ExpenseRepository(db)
    expense = await repo.create(
        user_id=current_user.id,
        category_id=body.category_id,
        title=body.title,
        amount=body.amount,
        type=body.type,
        date=body.date,
        note=body.note,
    )
    # Reload with the eagerly-joined category relationship
    expense = await repo.get_user_expense(expense.id, current_user.id)

    # Budget alert — only for expense type, only when user has a budget set
    if body.type == "expense" and current_user.monthly_budget:
        from services.notification import BUDGET_THRESHOLD, NotificationService
        month_total = await repo.get_month_total(
            current_user.id, body.date.year, body.date.month
        )
        if month_total >= current_user.monthly_budget * BUDGET_THRESHOLD:
            svc = NotificationService(db)
            await svc.notify_budget_alert(
                user_id=current_user.id,
                spent=month_total,
                budget=current_user.monthly_budget,
                currency=current_user.currency,
            )

    return ExpenseResponse.model_validate(expense)


# ── GET /expenses/:id ──────────────────────────────────────────────────────────

@router.get(
    "/{expense_id}", response_model=ExpenseResponse, response_model_by_alias=True
)
async def get_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseResponse:
    repo = ExpenseRepository(db)
    expense = await repo.get_user_expense(expense_id, current_user.id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Expense not found."},
        )
    return ExpenseResponse.model_validate(expense)


# ── PUT /expenses/:id ──────────────────────────────────────────────────────────

@router.put(
    "/{expense_id}", response_model=ExpenseResponse, response_model_by_alias=True
)
async def update_expense(
    expense_id: str,
    body: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseResponse:
    repo = ExpenseRepository(db)
    expense = await repo.get_user_expense(expense_id, current_user.id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Expense not found."},
        )
    updates = body.model_dump(exclude_none=True)
    updated = await repo.update(expense, **updates)
    # Reload to get fresh category
    updated = await repo.get_user_expense(updated.id, current_user.id)
    return ExpenseResponse.model_validate(updated)


# ── DELETE /expenses/:id ───────────────────────────────────────────────────────

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    repo = ExpenseRepository(db)
    expense = await repo.get_user_expense(expense_id, current_user.id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Expense not found."},
        )
    await repo.delete(expense)
