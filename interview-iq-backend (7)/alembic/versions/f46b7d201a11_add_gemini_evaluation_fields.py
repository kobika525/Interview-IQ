"""add Gemini evaluation fields

Revision ID: f46b7d201a11
Revises: d31a8e907f42
Create Date: 2026-08-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "f46b7d201a11"
down_revision: Union[str, None] = "d31a8e907f42"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # MySQL does not consistently permit defaults on JSON/TEXT columns. This
    # migration is also deliberately resumable because MySQL DDL is not
    # transactional and an older version of this migration could stop midway.
    bind = op.get_bind()
    existing = {column["name"] for column in sa.inspect(bind).get_columns("answer_evaluations")}

    columns = (
        sa.Column("overall_score", sa.Float(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("grammar_score", sa.Float(), nullable=True),
        sa.Column("fluency_score", sa.Float(), nullable=True),
        sa.Column("problem_solving_score", sa.Float(), nullable=True),
        sa.Column("strengths", sa.JSON(), nullable=True),
        sa.Column("weaknesses", sa.JSON(), nullable=True),
        sa.Column("interview_tips", sa.JSON(), nullable=True),
        sa.Column("career_advice", sa.JSON(), nullable=True),
        sa.Column("suggested_learning_resources", sa.JSON(), nullable=True),
        sa.Column("follow_up_question", sa.Text(), nullable=True),
        sa.Column("evaluation_provider", sa.String(length=30), nullable=True),
        sa.Column("evaluation_model", sa.String(length=100), nullable=True),
    )
    for column in columns:
        if column.name not in existing:
            op.add_column("answer_evaluations", column)

    for name in ("strengths", "weaknesses", "interview_tips", "career_advice", "suggested_learning_resources"):
        op.execute(sa.text(f"UPDATE answer_evaluations SET {name} = JSON_ARRAY() WHERE {name} IS NULL"))
        op.alter_column("answer_evaluations", name, existing_type=sa.JSON(), nullable=False)
    op.execute(sa.text("UPDATE answer_evaluations SET evaluation_provider = 'legacy' WHERE evaluation_provider IS NULL"))
    op.alter_column(
        "answer_evaluations", "evaluation_provider", existing_type=sa.String(length=30), nullable=False,
    )
    op.alter_column("answer_evaluations", "weight_version", server_default="gemini-v1")


def downgrade() -> None:
    op.alter_column("answer_evaluations", "weight_version", server_default="v1")
    for column in (
        "evaluation_model", "evaluation_provider", "follow_up_question", "suggested_learning_resources",
        "career_advice", "interview_tips", "weaknesses", "strengths", "problem_solving_score",
        "fluency_score", "grammar_score", "confidence_score", "overall_score",
    ):
        op.drop_column("answer_evaluations", column)
