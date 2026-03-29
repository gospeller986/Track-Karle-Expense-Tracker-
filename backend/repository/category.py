from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.category import Category
from repository.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Category, session)

    async def list_for_user(self, user_id: str) -> list[Category]:
        """Return system categories + this user's custom categories."""
        result = await self.session.execute(
            select(Category)
            .where(or_(Category.is_system.is_(True), Category.user_id == user_id))
            .order_by(Category.is_system.desc(), Category.name)
        )
        return list(result.scalars().all())

    async def get_user_category(self, category_id: str, user_id: str) -> Category | None:
        """Fetch a custom category only if it belongs to this user."""
        result = await self.session.execute(
            select(Category).where(
                Category.id == category_id,
                Category.user_id == user_id,
                Category.is_system.is_(False),
            )
        )
        return result.scalar_one_or_none()

    async def system_count(self) -> int:
        from sqlalchemy import func
        result = await self.session.execute(
            select(func.count()).select_from(Category).where(Category.is_system.is_(True))
        )
        return result.scalar_one()

    async def income_category_count(self) -> int:
        from sqlalchemy import func
        result = await self.session.execute(
            select(func.count()).select_from(Category).where(
                Category.is_system.is_(True),
                Category.category_type == "income",
            )
        )
        return result.scalar_one()
