"""add category_type to categories

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-29 00:00:00.000000

Adds a category_type column to distinguish expense-only, income-only,
and shared categories. Existing rows default to 'expense'.
"""

from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "categories",
        sa.Column(
            "category_type",
            sa.String(10),
            nullable=False,
            server_default="expense",
        ),
    )


def downgrade() -> None:
    op.drop_column("categories", "category_type")
