"""add persisted voice analysis fields

Revision ID: a03c58de729f
Revises: f46b7d201a11
Create Date: 2026-08-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a03c58de729f"
down_revision: Union[str, None] = "f46b7d201a11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    answer_existing = {column["name"] for column in sa.inspect(bind).get_columns("interview_answers")}
    report_existing = {column["name"] for column in sa.inspect(bind).get_columns("interview_reports")}
    answer_columns = (
        sa.Column("recording_duration_seconds", sa.Float(), nullable=True),
        sa.Column("words_per_minute", sa.Float(), nullable=True),
        sa.Column("speaking_speed", sa.String(length=30), nullable=True),
        sa.Column("average_pause_seconds", sa.Float(), nullable=True),
        sa.Column("longest_pause_seconds", sa.Float(), nullable=True),
        sa.Column("long_pause_count", sa.Integer(), nullable=True),
        sa.Column("filler_word_count", sa.Integer(), nullable=True),
        sa.Column("voice_confidence_score", sa.Float(), nullable=True),
        sa.Column("voice_fluency_score", sa.Float(), nullable=True),
        sa.Column("pronunciation_quality_score", sa.Float(), nullable=True),
        sa.Column("voice_clarity_score", sa.Float(), nullable=True),
        sa.Column("transcription_engine", sa.String(length=30), nullable=True),
    )
    report_columns = (
        sa.Column("recording_duration_seconds", sa.Float(), nullable=True),
        sa.Column("speaking_speed", sa.String(length=30), nullable=True),
        sa.Column("average_pause_seconds", sa.Float(), nullable=True),
        sa.Column("longest_pause_seconds", sa.Float(), nullable=True),
        sa.Column("voice_confidence_score", sa.Float(), nullable=True),
        sa.Column("voice_fluency_score", sa.Float(), nullable=True),
        sa.Column("pronunciation_quality_score", sa.Float(), nullable=True),
    )
    for column in answer_columns:
        if column.name not in answer_existing:
            op.add_column("interview_answers", column)
    for column in report_columns:
        if column.name not in report_existing:
            op.add_column("interview_reports", column)


def downgrade() -> None:
    for column in (
        "pronunciation_quality_score", "voice_fluency_score", "voice_confidence_score",
        "longest_pause_seconds", "average_pause_seconds", "speaking_speed", "recording_duration_seconds",
    ):
        op.drop_column("interview_reports", column)
    for column in (
        "transcription_engine", "voice_clarity_score", "pronunciation_quality_score",
        "voice_fluency_score", "voice_confidence_score", "filler_word_count", "long_pause_count",
        "longest_pause_seconds", "average_pause_seconds", "speaking_speed", "words_per_minute",
        "recording_duration_seconds",
    ):
        op.drop_column("interview_answers", column)
