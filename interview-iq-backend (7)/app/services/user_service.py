from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationAppError
from app.models.user import User
from app.repositories.career_repository import CareerRepository
from app.repositories.user_repository import UserRepository
from app.services.storage_service import delete_file, resolve_path, save_bytes
from app.utils.enums import ExperienceLevel, InterviewMode
from app.utils.file_validation import ALLOWED_IMAGE_EXTENSIONS, validate_upload

IMAGE_KIND_MAP = {"png": "png", "jpg": "jpg", "jpeg": "jpg", "webp": "webp"}


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.careers = CareerRepository(db)

    def get_profile(self, user: User):
        return user.profile

    def update_profile(self, user: User, data: dict):
        if "full_name" in data and data["full_name"]:
            user.full_name = data["full_name"]
        if "phone" in data and data["phone"] is not None:
            user.phone = data["phone"]

        profile = user.profile
        for field in ["bio", "location", "degree", "institute", "career_goal", "weekly_learning_goal_hours"]:
            if field in data and data[field] is not None:
                setattr(profile, field, data[field])

        if data.get("study_level"):
            self._set_study_level(profile, data["study_level"])
        if data.get("preferred_interview_mode"):
            self._set_interview_mode(profile, data["preferred_interview_mode"])
        if data.get("target_career_role_id"):
            role = self.careers.get_role(data["target_career_role_id"])
            if not role:
                raise NotFoundError("Selected career role was not found.")
            profile.target_career_role_id = role.id

        self.db.commit()
        return profile

    def _set_study_level(self, profile, value: str) -> None:
        try:
            profile.study_level = ExperienceLevel(value.upper())
        except ValueError:
            raise ValidationAppError(f"Invalid study level: {value}")

    def _set_interview_mode(self, profile, value: str) -> None:
        try:
            profile.preferred_interview_mode = InterviewMode(value.upper())
        except ValueError:
            raise ValidationAppError(f"Invalid interview mode: {value}")

    def upload_profile_image(self, user: User, filename: str, content: bytes):
        ext = validate_upload(filename, content, ALLOWED_IMAGE_EXTENSIONS, 5, IMAGE_KIND_MAP)
        result = save_bytes(content, filename, "profile_image")
        previous_avatar = user.profile.avatar_path
        user.profile.avatar_path = result["storage_key"]
        self.db.commit()
        if previous_avatar and previous_avatar != result["storage_key"]:
            delete_file(previous_avatar)
        return user.profile

    def get_profile_image_path(self, user: User) -> str:
        if not user.profile.avatar_path:
            raise NotFoundError("Profile image was not found.")
        return resolve_path(user.profile.avatar_path)

    def delete_profile_image(self, user: User):
        avatar_path = user.profile.avatar_path
        if avatar_path:
            user.profile.avatar_path = None
            self.db.commit()
            delete_file(avatar_path)
        return user.profile

    def get_onboarding(self, user: User):
        profile = user.profile
        return {
            "step": profile.onboarding_step,
            "completed": profile.onboarding_completed,
            "career_goal": profile.career_goal,
            "study_level": profile.study_level.value if profile.study_level else None,
            "target_career_role_id": profile.target_career_role_id,
            "preferred_interview_mode": profile.preferred_interview_mode.value if profile.preferred_interview_mode else None,
            "weekly_learning_goal_hours": profile.weekly_learning_goal_hours,
        }

    def update_onboarding(self, user: User, data: dict):
        profile = user.profile
        if data.get("career_goal"):
            profile.career_goal = data["career_goal"]
        if data.get("study_level"):
            self._set_study_level(profile, data["study_level"])
        if data.get("target_career_role_id"):
            profile.target_career_role_id = data["target_career_role_id"]
        if data.get("preferred_interview_mode"):
            self._set_interview_mode(profile, data["preferred_interview_mode"])
        if data.get("weekly_learning_goal_hours"):
            profile.weekly_learning_goal_hours = data["weekly_learning_goal_hours"]
        if data.get("skills"):
            for skill_name in data["skills"]:
                skill = self.careers.get_or_create_skill(skill_name)
                existing = [us for us in self.careers.get_user_skills(user.id) if us.skill_id == skill.id]
                if not existing:
                    self.careers.add_user_skill(user_id=user.id, skill_id=skill.id, source="ONBOARDING")
        profile.onboarding_step = max(profile.onboarding_step, data.get("step", profile.onboarding_step))
        self.db.commit()
        return self.get_onboarding(user)

    def complete_onboarding(self, user: User):
        user.profile.onboarding_completed = True
        self.db.commit()
        return self.get_onboarding(user)

    def delete_account(self, user: User) -> None:
        self.users.delete(user)
        self.db.commit()
