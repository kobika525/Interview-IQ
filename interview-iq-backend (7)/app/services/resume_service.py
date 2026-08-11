from sqlalchemy.orm import Session

from app.ai.resume.ats_scorer import compute_ats_score
from app.ai.resume.resume_recommender import build_strengths, build_suggestions, build_weaknesses
from app.ai.resume.section_detector import detect_sections
from app.ai.resume.skill_extractor import extract_general_skills, extract_matched_skills
from app.ai.resume.text_extractor import extract_text
from app.core.exceptions import ForbiddenError, NotFoundError, UnsupportedMediaTypeError
from app.core.permissions import enforce_usage_limit, increment_usage
from app.models.resume import Resume
from app.models.user import User
from app.repositories.career_repository import CareerRepository
from app.repositories.resume_repository import ResumeRepository
from app.services.notification_service import NotificationService
from app.services.storage_service import resolve_path, save_bytes
from app.utils.enums import NotificationType, ResumeStatus
from app.utils.file_validation import validate_resume_upload

MIME_BY_EXT = {"pdf": "application/pdf", "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}


class ResumeService:
    def __init__(self, db: Session):
        self.db = db
        self.resumes = ResumeRepository(db)
        self.careers = CareerRepository(db)
        self.notifications = NotificationService(db)

    def upload(self, user: User, filename: str, content: bytes, target_role_id: int | None, max_size_mb: int) -> Resume:
        enforce_usage_limit(self.db, user.id, "resume_scan")
        ext = validate_resume_upload(filename, content, max_size_mb)
        stored = save_bytes(content, filename, "resume")

        resume = self.resumes.create(
            user_id=user.id,
            original_filename=filename,
            stored_filename=stored["stored_filename"],
            file_path=stored["storage_key"],
            file_size=stored["file_size"],
            mime_type=MIME_BY_EXT[ext],
            target_role_id=target_role_id,
            status=ResumeStatus.UPLOADED,
        )
        self.db.commit()
        return resume

    def _ensure_owned(self, resume: Resume | None, user: User) -> Resume:
        if not resume:
            raise NotFoundError("Resume not found.")
        if resume.user_id != user.id and user.role.value != "ADMIN":
            raise ForbiddenError("You don't have access to this resume.")
        return resume

    def analyze(self, user: User, resume_id: int) -> dict:
        resume = self._ensure_owned(self.resumes.get_by_id(resume_id), user)

        try:
            resume.status = ResumeStatus.PROCESSING
            self.db.flush()

            resume_text = extract_text(resolve_path(resume.file_path), resume.mime_type)
            if len(resume_text.strip()) < 20:
                raise UnsupportedMediaTypeError(
                    "Couldn't extract readable text from this file. It may be a scanned image without selectable text."
                )

            sections = detect_sections(resume_text)

            required_skills, recommended_skills, role_keywords = [], [], []
            if resume.target_role_id:
                role = self.careers.get_role(resume.target_role_id)
                if role:
                    role_skills = self.careers.get_role_skills(role.id)
                    required_skills = [rs.skill.name for rs in role_skills if rs.is_required]
                    recommended_skills = [rs.skill.name for rs in role_skills if not rs.is_required]
                    role_keywords = required_skills + recommended_skills

            matched_required = extract_matched_skills(resume_text, required_skills) if required_skills else []
            matched_keywords = extract_matched_skills(resume_text, role_keywords) if role_keywords else []
            general_skills = extract_general_skills(resume_text)

            scores = compute_ats_score(
                resume_text=resume_text, sections_detected=sections,
                matched_required_skills=matched_required, required_skills=required_skills,
                matched_keywords=matched_keywords, role_keywords=role_keywords,
            )

            missing_required = [s for s in required_skills if s not in matched_required]
            strengths = build_strengths(scores, sections, matched_required or general_skills)
            weaknesses = build_weaknesses(scores, sections, missing_required)
            suggestions = build_suggestions(scores, sections, missing_required)

            analysis = self.resumes.create_analysis(
                resume_id=resume.id,
                overall_score=scores["overall_score"],
                keyword_score=scores["keyword_score"],
                formatting_score=scores["formatting_score"],
                experience_score=scores["experience_score"],
                education_score=scores["education_score"],
                achievement_score=scores["achievement_score"],
                section_completeness_score=scores["section_completeness_score"],
                strengths=strengths,
                weaknesses=weaknesses,
                suggestions=suggestions,
                sections_detected=sections,
            )

            for skill_name in (matched_required or general_skills):
                skill = self.careers.get_or_create_skill(skill_name)
                self.resumes.add_resume_skill(analysis_id=analysis.id, skill_id=skill.id, is_missing=False, confidence=1.0)
            for skill_name in missing_required:
                skill = self.careers.get_or_create_skill(skill_name)
                self.resumes.add_resume_skill(analysis_id=analysis.id, skill_id=skill.id, is_missing=True, confidence=1.0)

            resume.status = ResumeStatus.COMPLETED
            increment_usage(self.db, user.id, "resume_scan")
            self.notifications.create(
                user_id=user.id, type=NotificationType.RESUME, title="Resume analysis completed",
                message=f"Your resume scored {scores['overall_score']}/100 — see the full breakdown.",
            )
            self.db.commit()
            return self._serialize_analysis(analysis)
        except Exception:
            resume.status = ResumeStatus.FAILED
            self.db.commit()
            raise

    def _serialize_analysis(self, analysis) -> dict:
        return {
            "id": analysis.id, "resume_id": analysis.resume_id, "overall_score": analysis.overall_score,
            "keyword_score": analysis.keyword_score, "formatting_score": analysis.formatting_score,
            "experience_score": analysis.experience_score, "education_score": analysis.education_score,
            "achievement_score": analysis.achievement_score,
            "section_completeness_score": analysis.section_completeness_score,
            "strengths": analysis.strengths, "weaknesses": analysis.weaknesses, "suggestions": analysis.suggestions,
            "sections_detected": analysis.sections_detected, "weight_version": analysis.weight_version,
            "created_at": analysis.created_at,
            "skills_found": [
                {"name": rs.skill.name, "category": rs.skill.category.value, "is_missing": rs.is_missing, "confidence": rs.confidence}
                for rs in analysis.resume_skills if not rs.is_missing
            ],
            "missing_skills": [
                {"name": rs.skill.name, "category": rs.skill.category.value, "is_missing": rs.is_missing, "confidence": rs.confidence}
                for rs in analysis.resume_skills if rs.is_missing
            ],
        }

    def get_analysis(self, user: User, resume_id: int) -> dict:
        resume = self._ensure_owned(self.resumes.get_by_id(resume_id), user)
        analysis = self.resumes.get_latest_analysis(resume.id)
        if not analysis:
            raise NotFoundError("No analysis found for this resume yet — run /analyze first.")
        return self._serialize_analysis(analysis)

    def reanalyze(self, user: User, resume_id: int) -> dict:
        return self.analyze(user, resume_id)

    def list_for_user(self, user: User, offset: int, limit: int, target_role_id: int | None = None):
        return self.resumes.list_for_user(user.id, offset, limit, target_role_id)

    def get(self, user: User, resume_id: int) -> Resume:
        return self._ensure_owned(self.resumes.get_by_id(resume_id), user)

    def delete(self, user: User, resume_id: int) -> None:
        resume = self._ensure_owned(self.resumes.get_by_id(resume_id), user)
        self.resumes.delete(resume)
        self.db.commit()
