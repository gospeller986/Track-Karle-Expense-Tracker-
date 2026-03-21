from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from repository.subscription import SubscriptionRepository
from routes.auth import get_current_user
from schemas.subscription import (
    SubscriptionCreate,
    SubscriptionListResponse,
    SubscriptionResponse,
    SubscriptionSummary,
    SubscriptionUpdate,
)

router = APIRouter()


def _monthly_equivalent(amount: float, cycle: str) -> float:
    if cycle == "yearly":
        return amount / 12
    if cycle == "weekly":
        return amount * 52 / 12
    return amount  # monthly


# ── GET /subscriptions ─────────────────────────────────────────────────────────

@router.get("", response_model=SubscriptionListResponse, response_model_by_alias=True)
async def list_subscriptions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionListResponse:
    repo = SubscriptionRepository(db)
    subs = await repo.list_for_user(current_user.id)

    monthly_total = sum(_monthly_equivalent(s.amount, s.billing_cycle) for s in subs)
    return SubscriptionListResponse(
        data=[SubscriptionResponse.model_validate(s) for s in subs],
        summary=SubscriptionSummary(
            monthly_total=round(monthly_total, 2),
            yearly_total=round(monthly_total * 12, 2),
            count=len(subs),
        ),
    )


# ── POST /subscriptions ────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=SubscriptionResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_subscription(
    body: SubscriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionResponse:
    repo = SubscriptionRepository(db)
    sub = await repo.create(
        user_id=current_user.id,
        name=body.name,
        icon=body.icon,
        color=body.color,
        amount=body.amount,
        billing_cycle=body.billing_cycle,
        next_renewal=body.next_renewal,
        category=body.category,
    )
    return SubscriptionResponse.model_validate(sub)


# ── GET /subscriptions/:id ─────────────────────────────────────────────────────

@router.get(
    "/{subscription_id}",
    response_model=SubscriptionResponse,
    response_model_by_alias=True,
)
async def get_subscription(
    subscription_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionResponse:
    repo = SubscriptionRepository(db)
    sub = await repo.get_user_subscription(subscription_id, current_user.id)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Subscription not found."},
        )
    return SubscriptionResponse.model_validate(sub)


# ── PUT /subscriptions/:id ─────────────────────────────────────────────────────

@router.put(
    "/{subscription_id}",
    response_model=SubscriptionResponse,
    response_model_by_alias=True,
)
async def update_subscription(
    subscription_id: str,
    body: SubscriptionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionResponse:
    repo = SubscriptionRepository(db)
    sub = await repo.get_user_subscription(subscription_id, current_user.id)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Subscription not found."},
        )
    updates = body.model_dump(exclude_none=True)
    updated = await repo.update(sub, **updates)
    return SubscriptionResponse.model_validate(updated)


# ── DELETE /subscriptions/:id ──────────────────────────────────────────────────

@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subscription(
    subscription_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    repo = SubscriptionRepository(db)
    sub = await repo.get_user_subscription(subscription_id, current_user.id)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Subscription not found."},
        )
    await repo.delete(sub)
