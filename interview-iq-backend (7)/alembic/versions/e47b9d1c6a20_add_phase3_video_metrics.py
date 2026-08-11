"""Add Phase 3 OpenCV video metrics.

Revision ID: e47b9d1c6a20
Revises: d25fa79e4c18
"""

from alembic import op
import sqlalchemy as sa


revision = "e47b9d1c6a20"
down_revision = "d25fa79e4c18"
branch_labels = None
depends_on = None


ANSWER_FLOAT_COLUMNS = (
    "eye_contact_percentage",
    "face_detection_percentage",
    "head_position_score",
    "forward_facing_percentage",
    "looking_away_percentage",
    "smile_percentage",
    "face_visibility_percentage",
    "camera_stability_score",
    "lighting_quality_score",
    "body_language_confidence_score",
    "video_confidence_score",
)

REPORT_FLOAT_COLUMNS = (
    "eye_contact_percentage",
    "face_detection_percentage",
    "head_position_score",
    "looking_away_percentage",
    "smile_percentage",
    "camera_stability_score",
    "lighting_quality_score",
    "body_language_confidence_score",
    "video_confidence_score",
)


def _columns(table_name: str) -> set[str]:
    return {column["name"] for column in sa.inspect(op.get_bind()).get_columns(table_name)}


def _add_float_columns(table_name: str, names: tuple[str, ...]) -> None:
    missing = [name for name in names if name not in _columns(table_name)]
    if not missing:
        return
    if op.get_bind().dialect.name == "mysql":
        clauses = ", ".join(f"ADD COLUMN `{name}` FLOAT NULL" for name in missing)
        op.execute(sa.text(f"ALTER TABLE `{table_name}` {clauses}"))
        return
    for name in missing:
        op.add_column(table_name, sa.Column(name, sa.Float(), nullable=True))


def _drop_columns(table_name: str, names: tuple[str, ...]) -> None:
    existing = _columns(table_name)
    present = [name for name in names if name in existing]
    if not present:
        return
    if op.get_bind().dialect.name == "mysql":
        clauses = ", ".join(f"DROP COLUMN `{name}`" for name in present)
        op.execute(sa.text(f"ALTER TABLE `{table_name}` {clauses}"))
        return
    for name in present:
        op.drop_column(table_name, name)


def upgrade() -> None:
    _add_float_columns("interview_answers", ANSWER_FLOAT_COLUMNS)
    answer_columns = _columns("interview_answers")
    if "recording_stability_note" not in answer_columns:
        op.add_column(
            "interview_answers",
            sa.Column("recording_stability_note", sa.String(length=60), nullable=True),
        )

    _add_float_columns("interview_reports", REPORT_FLOAT_COLUMNS)


def downgrade() -> None:
    _drop_columns("interview_reports", tuple(reversed(REPORT_FLOAT_COLUMNS)))

    answer_columns = _columns("interview_answers")
    if "recording_stability_note" in answer_columns:
        op.drop_column("interview_answers", "recording_stability_note")
    _drop_columns("interview_answers", tuple(reversed(ANSWER_FLOAT_COLUMNS)))
