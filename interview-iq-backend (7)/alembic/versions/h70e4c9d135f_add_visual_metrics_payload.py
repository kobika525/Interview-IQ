"""Store raw visual presentation measurements and statuses.

Revision ID: h70e4c9d135f
Revises: g69d3b8f024e
"""

from alembic import op
import sqlalchemy as sa

revision = "h70e4c9d135f"
down_revision = "g69d3b8f024e"
branch_labels = None
depends_on = None


def _has_column(table: str, name: str) -> bool:
    return name in {column["name"] for column in sa.inspect(op.get_bind()).get_columns(table)}


def upgrade() -> None:
    for table in ("interview_answers", "interview_reports"):
        if not _has_column(table, "visual_metrics"):
            op.add_column(table, sa.Column("visual_metrics", sa.JSON(), nullable=True))


def downgrade() -> None:
    for table in ("interview_reports", "interview_answers"):
        if _has_column(table, "visual_metrics"):
            op.drop_column(table, "visual_metrics")
