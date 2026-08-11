from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utcnow
from app.utils.enums import ResumeStatus


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    target_role_id: Mapped[int | None] = mapped_column(ForeignKey("career_roles.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[ResumeStatus] = mapped_column(default=ResumeStatus.UPLOADED, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    analyses = relationship(
        "ResumeAnalysis", back_populates="resume", cascade="all, delete-orphan",
        order_by="ResumeAnalysis.created_at.desc()",
    )
    target_role = relationship("CareerRole")

    @property
    def latest_analysis(self):
        """Expose the newest analysis to the resume response schema."""
        return self.analyses[0] if self.analyses else None


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), index=True, nullable=False)

    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    keyword_score: Mapped[float] = mapped_column(Float, nullable=False)
    formatting_score: Mapped[float] = mapped_column(Float, nullable=False)
    experience_score: Mapped[float] = mapped_column(Float, nullable=False)
    education_score: Mapped[float] = mapped_column(Float, nullable=False)
    achievement_score: Mapped[float] = mapped_column(Float, nullable=False)
    section_completeness_score: Mapped[float] = mapped_column(Float, nullable=False)

    strengths: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    weaknesses: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    suggestions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    sections_detected: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    weight_version: Mapped[str] = mapped_column(String(20), default="v1", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    resume = relationship("Resume", back_populates="analyses")
    resume_skills = relationship("ResumeSkill", back_populates="analysis", cascade="all, delete-orphan")

    @property
    def skills_found(self) -> list[dict]:
        return [
            {
                "name": resume_skill.skill.name,
                "category": resume_skill.skill.category.value,
                "is_missing": resume_skill.is_missing,
                "confidence": resume_skill.confidence,
            }
            for resume_skill in self.resume_skills
            if not resume_skill.is_missing
        ]

    @property
    def missing_skills(self) -> list[dict]:
        return [
            {
                "name": resume_skill.skill.name,
                "category": resume_skill.skill.category.value,
                "is_missing": resume_skill.is_missing,
                "confidence": resume_skill.confidence,
            }
            for resume_skill in self.resume_skills
            if resume_skill.is_missing
        ]


class ResumeSkill(Base):
    __tablename__ = "resume_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("resume_analyses.id", ondelete="CASCADE"), index=True, nullable=False)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=False)
    is_missing: Mapped[bool] = mapped_column(default=False, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    analysis = relationship("ResumeAnalysis", back_populates="resume_skills")
    skill = relationship("Skill")
