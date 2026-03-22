from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from repository.group import GroupRepository
from repository.settlement import SettlementRepository
from routes.auth import get_current_user
from schemas.settlement import (
    DebtItem,
    GroupBalanceResponse,
    SettlementCreate,
    SettlementResponse,
)

router = APIRouter()


def _settlement_to_response(s) -> SettlementResponse:
    return SettlementResponse(
        id=s.id,
        group_id=s.group_id,
        payer_id=s.payer_id,
        payer_name=s.payer.name if s.payer else s.payer_id,
        payee_id=s.payee_id,
        payee_name=s.payee.name if s.payee else s.payee_id,
        amount=float(s.amount),
        date=s.date,
        note=s.note,
        created_at=s.created_at,
    )


@router.get(
    "/{group_id}/balances",
    response_model=GroupBalanceResponse,
    response_model_by_alias=True,
)
async def get_group_balances(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group_repo = GroupRepository(db)
    group = await group_repo.get_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if not await group_repo.is_member(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")

    member_ids   = [gm.user.id   for gm in group.members]
    member_names = {gm.user.id: gm.user.name for gm in group.members}

    your_balance, total_expenses = await group_repo.compute_balance(group_id, current_user.id)
    raw_debts = await group_repo.compute_pairwise_balances(group_id, member_ids, member_names)

    debts = [DebtItem(**d) for d in raw_debts]
    return GroupBalanceResponse(
        your_balance=your_balance,
        total_expenses=total_expenses,
        debts=debts,
    )


@router.post(
    "/{group_id}/settle",
    status_code=status.HTTP_201_CREATED,
    response_model=SettlementResponse,
    response_model_by_alias=True,
)
async def record_settlement(
    group_id: str,
    payload: SettlementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group_repo = GroupRepository(db)
    group = await group_repo.get_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if not await group_repo.is_member(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")
    if payload.payee_id == current_user.id:
        raise HTTPException(status_code=422, detail="Cannot settle with yourself")
    if not await group_repo.is_member(group_id, payload.payee_id):
        raise HTTPException(status_code=422, detail="Payee is not a member of this group")

    # Capture before commit — db.commit() expires all loaded ORM objects
    group_name = group.name
    payer_name = current_user.name
    payer_currency = current_user.currency

    repo = SettlementRepository(db)
    settlement = await repo.create(
        group_id=group_id,
        payer_id=current_user.id,
        payee_id=payload.payee_id,
        amount=payload.amount,
        date=payload.date,
        note=payload.note,
    )
    settlement_id = settlement.id  # capture before commit expires it
    await db.commit()

    # Notify the payee
    from services.notification import NotificationService
    svc = NotificationService(db)
    await svc.notify_settlement_created(
        group_id=group_id,
        group_name=group_name,
        settlement_id=settlement_id,
        payee_id=payload.payee_id,
        payer_name=payer_name,
        amount=float(payload.amount),
        currency=payer_currency,
    )
    await db.commit()

    return _settlement_to_response(settlement)
