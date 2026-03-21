"""add invite_token to groups

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-22 00:00:00.000000

All group-related tables (groups, group_members, group_expenses,
group_expense_splits, settlements) already existed in the DB via
create_tables(). This migration only adds the invite_token column
that was not present in the original model.
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("groups", sa.Column("invite_token", sa.String(64), nullable=True))
    op.create_index(op.f("ix_groups_invite_token"), "groups", ["invite_token"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_groups_invite_token"), table_name="groups")
    op.drop_column("groups", "invite_token")
