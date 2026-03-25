"""add group tables

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-25 00:00:00.000000

Creates: groups, group_members, group_expenses, group_expense_splits, settlements
(invite_token is included from the start for fresh Postgres deployments)
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
    op.create_table(
        "groups",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("icon", sa.String(10), nullable=False, server_default="👥"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(36), nullable=False),
        sa.Column("invite_token", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("invite_token"),
    )
    op.create_index("ix_groups_invite_token", "groups", ["invite_token"], unique=True)

    op.create_table(
        "group_members",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("group_id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("role", sa.Enum("admin", "member", name="group_role"), nullable=False, server_default="member"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_group_members_group_id", "group_members", ["group_id"], unique=False)
    op.create_index("ix_group_members_user_id", "group_members", ["user_id"], unique=False)

    op.create_table(
        "group_expenses",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("group_id", sa.String(36), nullable=False),
        sa.Column("category_id", sa.String(36), nullable=False),
        sa.Column("paid_by", sa.String(36), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("split_type", sa.Enum("equal", "unequal", "percentage", name="split_type"), nullable=False, server_default="equal"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("is_settled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["paid_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_group_expenses_group_id", "group_expenses", ["group_id"], unique=False)

    op.create_table(
        "group_expense_splits",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("expense_id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("percentage", sa.Numeric(5, 2), nullable=True),
        sa.Column("is_settled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["expense_id"], ["group_expenses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_group_expense_splits_expense_id", "group_expense_splits", ["expense_id"], unique=False)

    op.create_table(
        "settlements",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("group_id", sa.String(36), nullable=False),
        sa.Column("payer_id", sa.String(36), nullable=False),
        sa.Column("payee_id", sa.String(36), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("note", sa.String(300), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["payer_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["payee_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_settlements_group_id", "settlements", ["group_id"], unique=False)


def downgrade() -> None:
    op.drop_table("settlements")
    op.drop_table("group_expense_splits")
    op.drop_table("group_expenses")
    op.drop_table("group_members")
    op.drop_table("groups")
    op.execute("DROP TYPE IF EXISTS split_type")
    op.execute("DROP TYPE IF EXISTS group_role")
