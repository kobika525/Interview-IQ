from datetime import datetime

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utcnow
from app.utils.enums import (
    Difficulty, ExperienceLevel, InterviewMode, InterviewStatus, InterviewType, QuestionSource,
)


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    career_role_id: Mapped[int | None] = mapped_column(ForeignKey("career_roles.id", ondelete="SET NULL"), nullable=True)
    topic: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    difficulty: Mapped[Difficulty] = mapped_column(default=Difficulty.BEGINNER, nullable=False)
    interview_type: Mapped[InterviewType] = mapped_column(default=InterviewType.TECHNICAL, nullable=False)
    expected_keywords: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    expected_key_points: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    sample_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    source: Mapped[QuestionSource] = mapped_column(default=QuestionSource.ADMIN, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    career_role = relationship("CareerRole")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    career_role_id: Mapped[int | None] = mapped_column(ForeignKey("career_roles.id", ondelete="SET NULL"), nullable=True)
    resume_id: Mapped[int | None] = mapped_column(ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    mode: Mapped[InterviewMode] = mapped_column(default=InterviewMode.TEXT, nullable=False)
    interview_type: Mapped[InterviewType] = mapped_column(default=InterviewType.MIXED, nullable=False)
    experience_level: Mapped[ExperienceLevel] = mapped_column(default=ExperienceLevel.BEGINNER, nullable=False)
    difficulty: Mapped[Difficulty] = mapped_column(default=Difficulty.BEGINNER, nullable=False)
    requested_question_count: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    question_categories: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    job_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(20), default="en", nullable=False)

    status: Mapped[InterviewStatus] = mapped_column(default=InterviewStatus.CREATED, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    career_role = relationship("CareerRole")
    resume = relationship("Resume")
    session_questions = relationship(
        "SessionQuestion", back_populates="session", cascade="all, delete-orphan",
        order_by="SessionQuestion.order_number",
    )
    report = relationship("InterviewReport", back_populates="session", uselist=False, cascade="all, delete-orphan")


class SessionQuestion(Base):
    __tablename__ = "session_questions"
    __table_args__ = (UniqueConstraint("session_id", "order_number", name="uq_session_question_order"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    question_id: Mapped[int] = mapped_column(ForeignKey("interview_questions.id", ondelete="CASCADE"), nullable=False)
    question_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    order_number: Mapped[int] = mapped_column(Integer, nullable=False)
    is_skipped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    session = relationship("InterviewSession", back_populates="session_questions")
    question = relationship("InterviewQuestion")
    answer = relationship("InterviewAnswer", back_populates="session_question", uselist=False, cascade="all, delete-orphan")


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_question_id: Mapped[int] = mapped_column(
        ForeignKey("session_questions.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    word_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    char_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    recording_duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    words_per_minute: Mapped[float | None] = mapped_column(Float, nullable=True)
    speaking_speed: Mapped[str | None] = mapped_column(String(30), nullable=True)
    average_pause_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    longest_pause_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    long_pause_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    filler_word_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    voice_confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    voice_fluency_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    pronunciation_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    voice_clarity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    transcription_engine: Mapped[str | None] = mapped_column(String(30), nullable=True)
    eye_contact_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    face_detection_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    head_position_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    forward_facing_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    looking_away_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    smile_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    face_visibility_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    camera_stability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    lighting_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    body_language_confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    video_confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    visual_metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    recording_stability_note: Mapped[str | None] = mapped_column(String(60), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    session_question = relationship("SessionQuestion", back_populates="answer")
    evaluation = relationship("AnswerEvaluation", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class AnswerEvaluation(Base):
    __tablename__ = "answer_evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    answer_id: Mapped[int] = mapped_column(
        ForeignKey("interview_answers.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )

    relevance_score: Mapped[float] = mapped_column(Float, nullable=False)
    technical_score: Mapped[float] = mapped_column(Float, nullable=False)
    communication_score: Mapped[float] = mapped_column(Float, nullable=False)
    structure_score: Mapped[float] = mapped_column(Float, nullable=False)
    star_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    keyword_coverage: Mapped[float] = mapped_column(Float, nullable=False)

    matched_keywords: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    missing_keywords: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    feedback: Mapped[str] = mapped_column(Text, nullable=False)
    model_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    improvement_suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Gemini commercial evaluation payload. Legacy score columns above remain
    # available so existing API consumers and reports are backward compatible.
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    grammar_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    fluency_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    problem_solving_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    strengths: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    weaknesses: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    interview_tips: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    career_advice: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    suggested_learning_resources: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    follow_up_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    evaluation_provider: Mapped[str] = mapped_column(String(30), default="gemini", nullable=False)
    evaluation_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gemini_analysis: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    weight_version: Mapped[str] = mapped_column(String(20), default="gemini-v1", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    answer = relationship("InterviewAnswer", back_populates="evaluation")
