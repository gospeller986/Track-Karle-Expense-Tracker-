from __future__ import annotations

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.password_reset_token import PasswordResetToken
from models.refresh_token import RefreshToken
from models.base import utcnow
from repository.base import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(RefreshToken, session)

    async def find_by_hash(self, token_hash: str) -> RefreshToken | None:
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke(self, token: RefreshToken) -> None:
        await self.update(token, revoked=True)

    async def revoke_all_for_user(self, user_id: str) -> None:
        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
            .values(revoked=True)
        )
        await self.session.flush()


class PasswordResetTokenRepository(BaseRepository[PasswordResetToken]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(PasswordResetToken, session)

    async def find_valid_by_hash(self, token_hash: str) -> PasswordResetToken | None:
        """Return a token that has not been used and has not expired."""
        now = utcnow()
        result = await self.session.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.used.is_(False),
                PasswordResetToken.expires_at > now,
            )
        )
        return result.scalar_one_or_none()
