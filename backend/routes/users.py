from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from repository.auth import RefreshTokenRepository
from repository.user import UserRepository
from routes.auth import get_current_user
from schemas.user import UpdateProfileRequest, UserProfileResponse

router = APIRouter()


# ── GET /users/me ──────────────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserProfileResponse,
    response_model_by_alias=True,
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserProfileResponse:
    return UserProfileResponse.model_validate(current_user)


# ── PUT /users/me ──────────────────────────────────────────────────────────────

@router.put(
    "/me",
    response_model=UserProfileResponse,
    response_model_by_alias=True,
)
async def update_me(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserProfileResponse:
    user_repo = UserRepository(db)
    updates = body.model_dump(exclude_none=True)
    updated = await user_repo.update(current_user, **updates)
    return UserProfileResponse.model_validate(updated)


# ── DELETE /users/me ───────────────────────────────────────────────────────────

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    # Revoke all refresh tokens first, then hard-delete the user row.
    rt_repo = RefreshTokenRepository(db)
    await rt_repo.revoke_all_for_user(current_user.id)

    user_repo = UserRepository(db)
    await user_repo.delete(current_user)
