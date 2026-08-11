from sqlalchemy.orm import Session

from app.ai.career.career_matcher import canonical_skill, match_career_role
from app.ai.career.recommendation_enricher import enrich_recommendations
from app.ai.career.skill_gap_analyzer import analyze_skill_gap
from app.ai.resume.text_extractor import extract_text
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.user import User
from app.repositories.career_repository import CareerRepository
from app.repositories.resume_repository import ResumeRepository
from app.services.storage_service import resolve_path


class CareerService:
    def __init__(self, db: Session):
        self.db = db
        self.careers = CareerRepository(db)
        self.resumes = ResumeRepository(db)

    def list_roles(self, offset: int, limit: int):
        return self.careers.list_roles(offset, limit)

    def get_role(self, role_id: int):
        role = self.careers.get_role(role_id)
        if not role:
            raise NotFoundError("Career role not found.")
        return role

    def _role_skill_lists(self, role_id: int) -> tuple[list[str], list[str]]:
        role_skills = self.careers.get_role_skills(role_id)
        required = [rs.skill.name for rs in role_skills if rs.is_required]
        recommended = [rs.skill.name for rs in role_skills if not rs.is_required]
        return required, recommended

    def _role_skill_evidence(self, role_id: int):
        role_skills = self.careers.get_role_skills(role_id)
        required = [rs.skill.name for rs in role_skills if rs.is_required]
        recommended = [rs.skill.name for rs in role_skills if not rs.is_required]
        required_weights = {canonical_skill(rs.skill.name): rs.weight for rs in role_skills if rs.is_required}
        recommended_weights = {canonical_skill(rs.skill.name): rs.weight for rs in role_skills if not rs.is_required}
        return required, recommended, required_weights, recommended_weights

    def _resume_text_for(self, user: User, resume_id: int | None) -> str | None:
        if not resume_id:
            return None

    def _resume_evidence(self, user: User, resume_id: int | None):
        resume = self.resumes.get_by_id(resume_id) if resume_id else None
        if resume and resume.user_id != user.id:
            resume = None
        if not resume:
            resumes, _ = self.resumes.list_for_user(user.id, 0, 1)
            resume = resumes[0] if resumes else None
        if not resume:
            return None, None, []
        analysis = self.resumes.get_latest_analysis(resume.id)
        skills = [rs.skill.name for rs in analysis.resume_skills if not rs.is_missing] if analysis else []
        return resume.id, self._resume_text_for(user, resume.id), skills

    @staticmethod
    def _unique_skills(*groups: list[str]) -> list[str]:
        seen = set()
        result = []
        for skill in (skill for group in groups for skill in group):
            key = skill.strip().lower()
            if key and key not in seen:
                seen.add(key)
                result.append(skill.strip())
        return result
        resume = self.resumes.get_by_id(resume_id)
        if not resume or resume.user_id != user.id:
            return None
        try:
            return extract_text(resolve_path(resume.file_path), resume.mime_type)
        except Exception:
            return None

    def generate_matches(self, user: User, data) -> list[dict]:
        roles, _ = self.careers.list_roles(0, 50)
        resume_id, resume_text, resume_skills = self._resume_evidence(user, data.resume_id)
        profile_skills = [us.skill.name for us in self.careers.get_user_skills(user.id)]
        user_skills = self._unique_skills(profile_skills, resume_skills, data.current_skills)
        user_experience_level = data.experience_level or (
            user.profile.study_level.value if user.profile.study_level else "BEGINNER"
        )
        education = data.education_level or user.profile.degree or (
            user.profile.study_level.value if user.profile.study_level else None
        )
        career_context = " ".join(filter(None, [
            data.interests, data.preferred_work_style, data.target_location,
            data.career_goals, user.profile.career_goal,
        ]))
        evidence_sources = [name for name, present in (
            ("profile skills", bool(profile_skills)), ("resume", bool(resume_id)),
            ("provided skills", bool(data.current_skills)), ("education", bool(education)),
            ("experience", bool(user_experience_level)), ("career goals", bool(career_context)),
        ) if present]

        scored = []
        for role in roles:
            required, recommended, required_weights, recommended_weights = self._role_skill_evidence(role.id)
            role_text = " ".join(filter(None, [role.title, role.description, role.responsibilities]))
            match_result = match_career_role(
                user_skills=user_skills, required_skills=required, recommended_skills=recommended,
                user_experience_level=user_experience_level, role_experience_level=role.experience_level.value,
                resume_text=resume_text, role_description=role_text,
                preferred_industry=data.preferred_industry, education_level=education,
                career_context=career_context, required_weights=required_weights,
                recommended_weights=recommended_weights,
            )
            scored.append((role, match_result))

        scored.sort(key=lambda item: item[1]["match_score"], reverse=True)
        results = []
        for role, match_result in scored[:9]:
            match = self.careers.create_match(
                user_id=user.id, career_role_id=role.id, resume_id=resume_id,
                match_score=match_result["match_score"], matched_skills=match_result["matched_skills"],
                missing_skills=match_result["missing_skills"], priority_skills=match_result["priority_skills"],
                explanation=match_result["explanation"],
            )
            match.score_breakdown = match_result["score_breakdown"]
            match.evidence_sources = evidence_sources
            results.append(match)
        self.db.commit()
        return results

    def list_matches(self, user: User, offset: int, limit: int):
        return self.careers.list_matches(user.id, offset, limit)

    def get_match(self, user: User, match_id: int):
        match = self.careers.get_match(match_id)
        if not match:
            raise NotFoundError("Career match not found.")
        if match.user_id != user.id:
            raise ForbiddenError("You don't have access to this career match.")
        return match

    def analyze_skill_gap(self, user: User, data):
        role = self.get_role(data.career_role_id)
        required, recommended, required_weights, recommended_weights = self._role_skill_evidence(role.id)
        resume_id, _resume_text, resume_skills = self._resume_evidence(user, data.resume_id)
        profile_skills = [us.skill.name for us in self.careers.get_user_skills(user.id)]
        user_skills = self._unique_skills(profile_skills, resume_skills, data.additional_skills)
        experience = data.experience_level or (
            user.profile.study_level.value if user.profile.study_level else "BEGINNER"
        )
        education = data.education_level or user.profile.degree or (
            user.profile.study_level.value if user.profile.study_level else None
        )
        goals = data.career_goals or user.profile.career_goal
        role_text = " ".join(filter(None, [role.title, role.description, role.responsibilities]))

        result = analyze_skill_gap(
            user_skills=user_skills, required_skills=required, recommended_skills=recommended,
            user_experience_level=experience, role_experience_level=role.experience_level.value,
            education_level=education, role_description=role_text, career_goals=goals,
            required_weights=required_weights, recommended_weights=recommended_weights,
        )
        result["recommendations"] = enrich_recommendations(result["recommendations"], {
            "role": role.title, "matchedSkills": result["matched_skills"],
            "missingSkills": result["missing_skills"], "readiness": result["readiness_score"],
            "experience": experience, "education": education, "careerGoals": goals,
        })
        gap = self.careers.create_skill_gap(
            user_id=user.id, career_role_id=role.id,
            readiness_score=result["readiness_score"], matched_skills=result["matched_skills"],
            missing_skills=result["missing_skills"], priority_gaps=result["priority_gaps"],
            beginner_skills=result["beginner_skills"], intermediate_skills=result["intermediate_skills"],
            advanced_skills=result["advanced_skills"], estimated_prep_weeks=result["estimated_prep_weeks"],
        )
        self.db.commit()
        return {
            "id": gap.id, "career_role_id": gap.career_role_id,
            "readiness_score": gap.readiness_score, "matched_skills": gap.matched_skills,
            "missing_skills": gap.missing_skills, "priority_gaps": gap.priority_gaps,
            "beginner_skills": gap.beginner_skills, "intermediate_skills": gap.intermediate_skills,
            "advanced_skills": gap.advanced_skills, "estimated_prep_weeks": gap.estimated_prep_weeks,
            "created_at": gap.created_at, "score_breakdown": result["score_breakdown"],
            "recommendations": result["recommendations"],
            "evidence_sources": [name for name, present in (
                ("profile skills", bool(profile_skills)), ("resume", bool(resume_id)),
                ("provided skills", bool(data.additional_skills)), ("education", bool(education)),
                ("experience", bool(experience)), ("career goals", bool(goals)),
            ) if present],
        }

    def list_skill_gaps(self, user: User, offset: int, limit: int):
        return self.careers.list_skill_gaps(user.id, offset, limit)

    def get_skill_gap(self, user: User, analysis_id: int):
        gap = self.careers.get_skill_gap(analysis_id)
        if not gap:
            raise NotFoundError("Skill gap analysis not found.")
        if gap.user_id != user.id:
            raise ForbiddenError("You don't have access to this skill gap analysis.")
        return gap
