"""Add immutable interview question and Gemini-analysis snapshots.

Revision ID: g69d3b8f024e
Revises: f58c2a7e913d
"""

from alembic import op
import sqlalchemy as sa


revision = "g69d3b8f024e"
down_revision = "f58c2a7e913d"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> dict[str, dict]:
    return {column["name"]: column for column in sa.inspect(op.get_bind()).get_columns(table_name)}


def upgrade() -> None:
    session_question_columns = _columns("session_questions")
    if "question_snapshot" not in session_question_columns:
        op.add_column("session_questions", sa.Column("question_snapshot", sa.Text(), nullable=True))

    if op.get_bind().dialect.name == "mysql":
        op.execute(sa.text(
            "UPDATE session_questions AS sq "
            "JOIN interview_questions AS iq ON iq.id = sq.question_id "
            "SET sq.question_snapshot = iq.question_text "
            "WHERE sq.question_snapshot IS NULL"
        ))
    else:
        op.execute(sa.text(
            "UPDATE session_questions "
            "SET question_snapshot = ("
            "SELECT question_text FROM interview_questions "
            "WHERE interview_questions.id = session_questions.question_id"
            ") WHERE question_snapshot IS NULL"
        ))
    op.alter_column(
        "session_questions",
        "question_snapshot",
        existing_type=sa.Text(),
        nullable=False,
    )

    if "gemini_analysis" not in _columns("answer_evaluations"):
        op.add_column("answer_evaluations", sa.Column("gemini_analysis", sa.JSON(), nullable=True))


def downgrade() -> None:
    if "gemini_analysis" in _columns("answer_evaluations"):
        op.drop_column("answer_evaluations", "gemini_analysis")
    if "question_snapshot" in _columns("session_questions"):
        op.drop_column("session_questions", "question_snapshot")
