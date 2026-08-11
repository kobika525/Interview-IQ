"""Add Phase 4 comprehensive final-report fields.

Revision ID: f58c2a7e913d
Revises: e47b9d1c6a20
"""

from alembic import op
import sqlalchemy as sa


revision = "f58c2a7e913d"
down_revision = "e47b9d1c6a20"
branch_labels = None
depends_on = None


COLUMNS = {
    "grammar_score": sa.Float(),
    "voice_quality_score": sa.Float(),
    "improved_answers": sa.JSON(),
    "hiring_recommendation": sa.Text(),
}


def _column_names() -> set[str]:
    return {column["name"] for column in sa.inspect(op.get_bind()).get_columns("interview_reports")}


def upgrade() -> None:
    existing = _column_names()
    for name, column_type in COLUMNS.items():
        if name not in existing:
            op.add_column("interview_reports", sa.Column(name, column_type, nullable=True))


def downgrade() -> None:
    existing = _column_names()
    for name in reversed(COLUMNS):
        if name in existing:
            op.drop_column("interview_reports", name)
