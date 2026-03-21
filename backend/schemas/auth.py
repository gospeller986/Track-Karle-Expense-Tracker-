from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    """Base model that accepts snake_case internally and outputs camelCase JSON."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,  # also accept snake_case on input
    )


# ── Request schemas ────────────────────────────────────────────────────────────

class RegisterRequest(_CamelModel):
    name: str
    email: EmailStr
    password: str
    currency: str = "INR"


class LoginRequest(_CamelModel):
    email: EmailStr
    password: str


class RefreshRequest(_CamelModel):
    refresh_token: str  # camelCase alias: refreshToken


class LogoutRequest(_CamelModel):
    refresh_token: str  # camelCase alias: refreshToken


class ForgotPasswordRequest(_CamelModel):
    email: EmailStr


class ResetPasswordRequest(_CamelModel):
    token: str
    new_password: str  # camelCase alias: newPassword


# ── Response schemas ───────────────────────────────────────────────────────────

class AuthUserResponse(_CamelModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

    id: str
    name: str
    email: str
    currency: str


class AuthResponse(_CamelModel):
    user: AuthUserResponse
    access_token: str   # camelCase alias: accessToken
    refresh_token: str  # camelCase alias: refreshToken


class RefreshResponse(_CamelModel):
    access_token: str   # camelCase alias: accessToken
    refresh_token: str  # camelCase alias: refreshToken


class MessageResponse(BaseModel):
    message: str
