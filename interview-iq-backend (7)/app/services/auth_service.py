from datetime import timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError, ValidationAppError
from app.core.security import (
    create_access_token, create_refresh_token_value, hash_password, hash_token,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.notification_service import NotificationService
from app.utils.datetime import strip_tz, utcnow, utcnow_naive
from app.utils.enums import AccountStatus, NotificationType, UserRole


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.notifications = NotificationService(db)

    def register(self, data) -> tuple[User, str, str]:
        if self.users.get_by_email(data.email):
            raise ConflictError("An account with this email already exists.")

        user = self.users.create(
            full_name=data.full_name.strip(),
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            role=UserRole.USER,
            account_status=AccountStatus.ACTIVE,  # simplified for this project: no real SMTP configured by default
            email_verified=True,
        )
        if data.degree or data.institute or data.target_career:
            user.profile.degree = data.degree
            user.profile.institute = data.institute
            user.profile.career_goal = data.target_career
            # Note: `study_level` from the registration form is free text (e.g. "Final Year"),
            # while UserProfile.study_level is a fixed ExperienceLevel enum. We deliberately
            # don't coerce it here — onboarding (user_service.update_onboarding) validates and
            # sets it properly against the enum.

        self.notifications.create(
            user_id=user.id, type=NotificationType.SYSTEM, title="Welcome to Interview IQ",
            message="Your account was created successfully. Complete onboarding to personalise your prep.",
        )
        access, refresh = self._issue_tokens(user)
        self.db.commit()
        return user, access, refresh

    def login(self, email: str, password: str) -> tuple[User, str, str]:
        user = self.users.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise AuthenticationError("Incorrect email or password.")
        if user.account_status != AccountStatus.ACTIVE:
            raise AuthenticationError(f"Your account is {user.account_status.value.lower()}. Please contact support.")

        access, refresh = self._issue_tokens(user)
        self.db.commit()
        return user, access, refresh

    def _issue_tokens(self, user: User) -> tuple[str, str]:
        access = create_access_token(subject=str(user.id), extra_claims={"role": user.role.value})
        raw_refresh = create_refresh_token_value()
        expires_at = utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        self.users.store_refresh_token(user.id, hash_token(raw_refresh), expires_at)
        return access, raw_refresh

    def refresh(self, raw_refresh_token: str) -> tuple[User, str, str]:
        token_hash = hash_token(raw_refresh_token)
        stored = self.users.get_refresh_token(token_hash)
        if not stored or stored.revoked or strip_tz(stored.expires_at) < utcnow_naive():
            raise AuthenticationError("Refresh token is invalid or expired. Please log in again.")

        user = self.users.get_by_id(stored.user_id)
        if not user:
            raise AuthenticationError("User account no longer exists.")

        # Rotate: revoke the old token and issue a new pair.
        self.users.revoke_refresh_token(stored)
        access, new_refresh = self._issue_tokens(user)
        self.db.commit()
        return user, access, new_refresh

    def logout(self, raw_refresh_token: str) -> None:
        stored = self.users.get_refresh_token(hash_token(raw_refresh_token))
        if stored:
            self.users.revoke_refresh_token(stored)
            self.db.commit()

    def logout_all(self, user_id: int) -> None:
        self.users.revoke_all_refresh_tokens(user_id)
        self.db.commit()

    def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.password_hash):
            raise ValidationAppError("Current password is incorrect.")
        user.password_hash = hash_password(new_password)
        self.users.revoke_all_refresh_tokens(user.id)  # force re-login on all other devices
        self.db.commit()

    def forgot_password(self, email: str) -> None:
        """Always succeeds from the caller's perspective — never reveals
        whether the email exists, per the spec's security requirement."""
        user = self.users.get_by_email(email)
        if user:
            raw_token = create_refresh_token_value()
            self.users.store_password_reset_token(user.id, hash_token(raw_token), utcnow() + timedelta(hours=1))
            self.db.commit()
            # In production this would be emailed via SMTP; logged here for local dev.
            print(f"[DEV] Password reset token for {email}: {raw_token}")

    def reset_password(self, raw_token: str, new_password: str) -> None:
        record = self.users.get_password_reset_token(hash_token(raw_token))
        if not record or record.used or strip_tz(record.expires_at) < utcnow_naive():
            raise ValidationAppError("This password reset link is invalid or has expired.")
        user = self.users.get_by_id(record.user_id)
        if not user:
            raise NotFoundError("User not found.")
        user.password_hash = hash_password(new_password)
        record.used = True
        self.users.revoke_all_refresh_tokens(user.id)
        self.db.commit()

    def resend_verification(self, email: str) -> None:
        user = self.users.get_by_email(email)
        if user and not user.email_verified:
            raw_token = create_refresh_token_value()
            self.users.store_verification_token(user.id, hash_token(raw_token), utcnow() + timedelta(hours=24))
            self.db.commit()
            print(f"[DEV] Email verification token for {email}: {raw_token}")

    def verify_email(self, raw_token: str) -> None:
        record = self.users.get_verification_token(hash_token(raw_token))
        if not record or record.used or strip_tz(record.expires_at) < utcnow_naive():
            raise ValidationAppError("This verification link is invalid or has expired.")
        user = self.users.get_by_id(record.user_id)
        if not user:
            raise NotFoundError("User not found.")
        user.email_verified = True
        record.used = True
        self.db.commit()
