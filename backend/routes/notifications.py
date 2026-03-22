from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from routes.auth import get_current_user
from schemas.notification import (
    NotificationPreferencesResponse,
    RegisterDeviceRequest,
    UpdatePreferencesRequest,
)
from services.notification import NotificationService

router = APIRouter()


@router.post("/register-device", status_code=status.HTTP_204_NO_CONTENT)
async def register_device(
    body: RegisterDeviceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    svc = NotificationService(db)
    await svc.register_device(
        user_id=current_user.id,
        token=body.token,
        platform=body.platform,
        device_name=body.device_name,
    )
    await db.commit()


@router.get(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    response_model_by_alias=True,
)
async def get_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPreferencesResponse:
    svc = NotificationService(db)
    pref = await svc.get_preferences(current_user.id)
    await db.commit()  # persist if newly created
    return NotificationPreferencesResponse.model_validate(pref)


@router.put(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    response_model_by_alias=True,
)
async def update_preferences(
    body: UpdatePreferencesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPreferencesResponse:
    svc = NotificationService(db)
    updates = body.model_dump(exclude_none=True)
    pref = await svc.update_preferences(current_user.id, **updates)
    await db.commit()
    return NotificationPreferencesResponse.model_validate(pref)
