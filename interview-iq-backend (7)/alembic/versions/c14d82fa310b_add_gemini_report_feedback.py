"""add Gemini report feedback collections

Revision ID: c14d82fa310b
Revises: a03c58de729f
Create Date: 2026-08-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c14d82fa310b"
down_revision: Union[str, None] = "a03c58de729f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {column["name"] for column in sa.inspect(bind).get_columns("interview_reports")}
    for name in ("interview_tips", "career_advice", "suggested_learning_resources"):
        if name not in existing:
            op.add_column("interview_reports", sa.Column(name, sa.JSON(), nullable=True))
        op.execute(sa.text(f"UPDATE interview_reports SET {name} = JSON_ARRAY() WHERE {name} IS NULL"))
        op.alter_column("interview_reports", name, existing_type=sa.JSON(), nullable=False)


def downgrade() -> None:
    for name in ("suggested_learning_resources", "career_advice", "interview_tips"):
        op.drop_column("interview_reports", name)
