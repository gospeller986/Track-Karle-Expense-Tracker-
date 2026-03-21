from __future__ import annotations

import hashlib
import logging
import secrets
import uuid
from datetime import timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.base import utcnow
from repository.auth import PasswordResetTokenRepository, RefreshTokenRepository
from repository.user import UserRepository
from schemas.auth import (
    AuthResponse,
    AuthUserResponse,
    LoginRequest,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
)

logger = logging.getLogger(__name__)

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Access tokens are short-lived regardless of what config says for refresh tokens.
ACCESS_TOKEN_EXPIRE_MINUTES = 15


def _hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def _verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _create_access_token(user_id: str) -> str:
    now = utcnow()
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": now,
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def _create_refresh_token(user_id: str) -> str:
    now = utcnow()
    expire = now + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": now,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def _decode_token(token: str, expected_type: str) -> dict:
    """Decode and validate a JWT. Raises JWTError on any problem."""
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    if payload.get("type") != expected_type:
        raise JWTError("Wrong token type")
    return payload


def _auth_error(code: str, message: str, status_code: int = 401):
    from fastapi import HTTPException

    raise HTTPException(
        status_code=status_code,
        detail={"code": code, "message": message},
    )


class AuthService:
    # ── Register ───────────────────────────────────────────────────────────────

    async def register(self, db: AsyncSession, data: RegisterRequest) -> AuthResponse:
        user_repo = UserRepository(db)
        rt_repo = RefreshTokenRepository(db)

        existing = await user_repo.find_by_email(data.email)
        if existing:
            _auth_error("EMAIL_ALREADY_EXISTS", "An account with that email already exists.", 409)

        hashed_pw = _hash_password(data.password)
        user = await user_repo.create(
            name=data.name,
            email=data.email,
            hashed_password=hashed_pw,
            currency=data.currency,
        )

        access_token = _create_access_token(user.id)
        refresh_token = _create_refresh_token(user.id)

        now = utcnow()
        await rt_repo.create(
            user_id=user.id,
            token_hash=_sha256(refresh_token),
            expires_at=now + timedelta(days=settings.refresh_token_expire_days),
        )

        return AuthResponse(
            user=AuthUserResponse.model_validate(user),
            access_token=access_token,
            refresh_token=refresh_token,
        )

    # ── Login ──────────────────────────────────────────────────────────────────

    async def login(self, db: AsyncSession, data: LoginRequest) -> AuthResponse:
        user_repo = UserRepository(db)
        rt_repo = RefreshTokenRepository(db)

        user = await user_repo.find_by_email(data.email)
        if not user or not _verify_password(data.password, user.hashed_password):
            _auth_error("INVALID_CREDENTIALS", "Incorrect email or password.", 401)

        if not user.is_active:
            _auth_error("ACCOUNT_DISABLED", "This account has been disabled.", 403)

        access_token = _create_access_token(user.id)
        refresh_token = _create_refresh_token(user.id)

        now = utcnow()
        await rt_repo.create(
            user_id=user.id,
            token_hash=_sha256(refresh_token),
            expires_at=now + timedelta(days=settings.refresh_token_expire_days),
        )

        return AuthResponse(
            user=AuthUserResponse.model_validate(user),
            access_token=access_token,
            refresh_token=refresh_token,
        )

    # ── Refresh ────────────────────────────────────────────────────────────────

    async def refresh(self, db: AsyncSession, data: RefreshRequest) -> RefreshResponse:
        user_repo = UserRepository(db)
        rt_repo = RefreshTokenRepository(db)

        try:
            payload = _decode_token(data.refresh_token, "refresh")
        except JWTError:
            _auth_error("INVALID_TOKEN", "Refresh token is invalid or expired.", 401)

        user_id: str = payload["sub"]
        token_hash = _sha256(data.refresh_token)
        stored = await rt_repo.find_by_hash(token_hash)

        if not stored or stored.revoked:
            _auth_error("TOKEN_REVOKED", "Refresh token has been revoked.", 401)

        user = await user_repo.get(user_id)
        if not user or not user.is_active:
            _auth_error("USER_NOT_FOUND", "User not found or inactive.", 401)

        # Rotate: revoke old, issue new pair
        await rt_repo.revoke(stored)

        new_access = _create_access_token(user_id)
        new_refresh = _create_refresh_token(user_id)

        now = utcnow()
        await rt_repo.create(
            user_id=user_id,
            token_hash=_sha256(new_refresh),
            expires_at=now + timedelta(days=settings.refresh_token_expire_days),
        )

        return RefreshResponse(access_token=new_access, refresh_token=new_refresh)

    # ── Logout ─────────────────────────────────────────────────────────────────

    async def logout(self, db: AsyncSession, refresh_token: str) -> None:
        rt_repo = RefreshTokenRepository(db)

        try:
            _decode_token(refresh_token, "refresh")
        except JWTError:
            # Even with an invalid token, we attempt a best-effort revoke by hash.
            pass

        token_hash = _sha256(refresh_token)
        stored = await rt_repo.find_by_hash(token_hash)
        if stored and not stored.revoked:
            await rt_repo.revoke(stored)

    # ── Forgot password ────────────────────────────────────────────────────────

    async def forgot_password(self, db: AsyncSession, email: str) -> None:
        user_repo = UserRepository(db)
        prt_repo = PasswordResetTokenRepository(db)

        user = await user_repo.find_by_email(email)
        if not user:
            # Do not reveal whether the email exists.
            return

        reset_token = secrets.token_urlsafe(32)
        token_hash = _sha256(reset_token)
        now = utcnow()
        expires_at = now + timedelta(hours=1)

        await prt_repo.create(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )

        # Dev mode: print token to console (replace with email service in prod)
        print(f"[DEV] Password reset token for {email}: {reset_token}")
        logger.info("[DEV] Password reset token for %s: %s", email, reset_token)

    # ── Reset password ─────────────────────────────────────────────────────────

    async def reset_password(self, db: AsyncSession, token: str, new_password: str) -> None:
        user_repo = UserRepository(db)
        prt_repo = PasswordResetTokenRepository(db)

        token_hash = _sha256(token)
        stored = await prt_repo.find_valid_by_hash(token_hash)

        if not stored:
            _auth_error("INVALID_OR_EXPIRED_TOKEN", "Reset token is invalid or has expired.", 400)

        new_hashed = _hash_password(new_password)
        user = await user_repo.get(stored.user_id)
        if not user:
            _auth_error("USER_NOT_FOUND", "User not found.", 400)

        await user_repo.update(user, hashed_password=new_hashed)
        await prt_repo.update(stored, used=True)


auth_service = AuthService()
