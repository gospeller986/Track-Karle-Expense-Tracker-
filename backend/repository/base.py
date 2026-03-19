from __future__ import annotations
from typing import Any, Generic, Sequence, Type, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.base import UUIDBase

ModelT = TypeVar("ModelT", bound=UUIDBase)


class BaseRepository(Generic[ModelT]):
    """Generic async CRUD repository. Extend per entity."""

    def __init__(self, model: Type[ModelT], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def get(self, id: str) -> ModelT | None:
        return await self.session.get(self.model, id)

    async def get_all(
        self,
        *,
        filters: list[Any] | None = None,
        order_by: Any | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[ModelT], int]:
        q = select(self.model)
        count_q = select(func.count()).select_from(self.model)

        if filters:
            for f in filters:
                q = q.where(f)
                count_q = count_q.where(f)

        total = (await self.session.execute(count_q)).scalar_one()

        if order_by is not None:
            q = q.order_by(order_by)

        q = q.offset(offset).limit(limit)
        rows = (await self.session.execute(q)).scalars().all()
        return rows, total

    async def create(self, **kwargs: Any) -> ModelT:
        obj = self.model(**kwargs)
        self.session.add(obj)
        await self.session.flush()   # get DB-assigned id without committing
        await self.session.refresh(obj)
        return obj

    async def update(self, obj: ModelT, **kwargs: Any) -> ModelT:
        for key, value in kwargs.items():
            setattr(obj, key, value)
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def delete(self, obj: ModelT) -> None:
        await self.session.delete(obj)
        await self.session.flush()
