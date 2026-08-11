"""Remove the unused registration phone field.

Revision ID: b17c4d9a2e31
Revises: e358e97206df
"""

from alembic import op
import sqlalchemy as sa


revision = "b17c4d9a2e31"
down_revision = "e358e97206df"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("users", "phone")


def downgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(length=30), nullable=True))
