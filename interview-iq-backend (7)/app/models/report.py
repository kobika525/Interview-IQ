from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utcnow


class InterviewReport(Base):
    __tablename__ = "interview_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("interview_sessions.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )

    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    performance_label: Mapped[str] = mapped_column(String(30), nullable=False)

    communication_score: Mapped[float] = mapped_column(Float, nullable=False)
    technical_score: Mapped[float] = mapped_column(Float, nullable=False)
    problem_solving_score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    relevance_score: Mapped[float] = mapped_column(Float, nullable=False)
    structure_score: Mapped[float] = mapped_column(Float, nullable=False)
    professionalism_score: Mapped[float] = mapped_column(Float, nullable=False)
    grammar_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    voice_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Voice-specific (nullable — only populated for voice/video sessions)
    speaking_wpm: Mapped[float | None] = mapped_column(Float, nullable=True)
    filler_word_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    long_pause_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    speech_clarity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    recording_duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    speaking_speed: Mapped[str | None] = mapped_column(String(30), nullable=True)
    average_pause_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    longest_pause_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    voice_confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    voice_fluency_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    pronunciation_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Video-specific (nullable, low-weight, per Responsible-AI constraints)
    face_visibility_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    forward_facing_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    recording_stability_note: Mapped[str | None] = mapped_column(String(60), nullable=True)
    eye_contact_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    face_detection_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    head_position_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    looking_away_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    smile_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    camera_stability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    lighting_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    body_language_confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    video_confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    visual_metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    executive_summary: Mapped[str] = mapped_column(Text, nullable=False)
    strengths: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    growth_areas: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    interview_tips: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    career_advice: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    suggested_learning_resources: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    improved_answers: Mapped[list | None] = mapped_column(JSON, default=list, nullable=True)
    hiring_recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommended_resource_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    recommended_roadmap_item_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    weight_version: Mapped[str] = mapped_column(String(20), default="v1", nullable=False)
    model_disclaimer: Mapped[str] = mapped_column(
        Text,
        default=(
            "This report reflects an automated, AI-assisted estimate intended to support your "
            "preparation. It is advisory only, does not measure honesty, personality, or emotion, "
            "and should not be treated as a guarantee of interview or hiring outcomes."
        ),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    session = relationship("InterviewSession", back_populates="report")
