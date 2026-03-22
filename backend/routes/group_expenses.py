from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from repository.group import GroupRepository
from repository.group_expense import GroupExpenseRepository
from routes.auth import get_current_user
from schemas.group_expense import (
    GroupExpenseCreate,
    GroupExpenseListResponse,
    GroupExpenseResponse,
    GroupExpenseSplitResponse,
)

router = APIRouter()


def _expense_to_response(exp) -> GroupExpenseResponse:
    splits = [
        GroupExpenseSplitResponse(
            user_id=sp.user_id,
            user_name=sp.user.name if sp.user else sp.user_id,
            amount=float(sp.amount),
            percentage=float(sp.percentage) if sp.percentage is not None else None,
            is_settled=sp.is_settled,
        )
        for sp in exp.splits
    ]
    return GroupExpenseResponse(
        id=exp.id,
        group_id=exp.group_id,
        category_id=exp.category_id,
        paid_by=exp.paid_by,
        paid_by_name=exp.payer.name if exp.payer else exp.paid_by,
        title=exp.title,
        amount=float(exp.amount),
        date=exp.date,
        split_type=exp.split_type,
        note=exp.note,
        is_settled=exp.is_settled,
        splits=splits,
        created_at=exp.created_at,
    )


@router.get(
    "/{group_id}/expenses",
    response_model=GroupExpenseListResponse,
    response_model_by_alias=True,
)
async def list_group_expenses(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group_repo = GroupRepository(db)
    if not await group_repo.is_member(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    repo = GroupExpenseRepository(db)
    expenses = await repo.list_for_group(group_id)
    return GroupExpenseListResponse(data=[_expense_to_response(e) for e in expenses])


@router.post(
    "/{group_id}/expenses",
    status_code=status.HTTP_201_CREATED,
    response_model=GroupExpenseResponse,
    response_model_by_alias=True,
)
async def add_group_expense(
    group_id: str,
    payload: GroupExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group_repo = GroupRepository(db)
    group = await group_repo.get_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if not await group_repo.is_member(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    if not payload.split_with:
        raise HTTPException(status_code=422, detail="split_with must not be empty")

    # Capture everything needed for notifications BEFORE commit —
    # db.commit() expires all loaded ORM objects so accessing them afterwards
    # triggers lazy loads which are not allowed in async SQLAlchemy.
    member_ids = [gm.user.id for gm in group.members]
    payer = next((gm.user for gm in group.members if gm.user.id == payload.paid_by), None)
    payer_name = payer.name if payer else "Someone"
    currency = payer.currency if payer else "INR"
    group_name = group.name

    repo = GroupExpenseRepository(db)
    expense = await repo.create(group_id=group_id, payload=payload)

    # Capture expense fields before commit expires the object
    expense_id = expense.id
    expense_title = expense.title
    expense_amount = float(expense.amount)
    expense_paid_by = expense.paid_by

    await db.commit()

    from services.notification import NotificationService
    svc = NotificationService(db)
    await svc.notify_group_expense_added(
        group_id=group_id,
        group_name=group_name,
        expense_id=expense_id,
        expense_title=expense_title,
        expense_amount=expense_amount,
        currency=currency,
        payer_name=payer_name,
        payer_id=expense_paid_by,
        member_ids=member_ids,
    )
    await db.commit()

    return _expense_to_response(expense)


@router.delete(
    "/{group_id}/expenses/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_group_expense(
    group_id: str,
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group_repo = GroupRepository(db)
    if not await group_repo.is_member(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    exp_repo = GroupExpenseRepository(db)
    expense = await exp_repo.get_by_id(expense_id)
    if not expense or expense.group_id != group_id:
        raise HTTPException(status_code=404, detail="Expense not found")
    # Only payer or group creator can delete
    group = await group_repo.get_by_id(group_id)
    if expense.paid_by != current_user.id and group.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the payer or group creator can delete this expense")
    await exp_repo.delete(expense_id)
    await db.commit()
