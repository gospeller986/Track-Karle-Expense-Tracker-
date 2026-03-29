from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from repository.category import CategoryRepository
from routes.auth import get_current_user
from schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter()


# ── GET /categories ────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=list[CategoryResponse],
    response_model_by_alias=True,
)
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CategoryResponse]:
    repo = CategoryRepository(db)
    cats = await repo.list_for_user(current_user.id)
    return [CategoryResponse.model_validate(c) for c in cats]


# ── POST /categories ───────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=CategoryResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryResponse:
    repo = CategoryRepository(db)
    cat = await repo.create(
        name=body.name,
        icon=body.icon,
        color=body.color,
        category_type=body.category_type,
        is_system=False,
        user_id=current_user.id,
    )
    return CategoryResponse.model_validate(cat)


# ── PUT /categories/:id ────────────────────────────────────────────────────────

@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    response_model_by_alias=True,
)
async def update_category(
    category_id: str,
    body: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryResponse:
    repo = CategoryRepository(db)
    cat = await repo.get_user_category(category_id, current_user.id)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Category not found or cannot be edited."},
        )
    updates = body.model_dump(exclude_none=True)
    updated = await repo.update(cat, **updates)
    return CategoryResponse.model_validate(updated)


# ── DELETE /categories/:id ─────────────────────────────────────────────────────

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    repo = CategoryRepository(db)
    cat = await repo.get_user_category(category_id, current_user.id)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Category not found or cannot be deleted."},
        )
    await repo.delete(cat)
