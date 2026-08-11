from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import EmailVerificationToken, PasswordResetToken, RefreshToken, User
from app.models.profile import UserProfile
from app.utils.datetime import utcnow


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email.lower()))

    def create(self, **kwargs) -> User:
        user = User(**kwargs)
        self.db.add(user)
        self.db.flush()
        profile = UserProfile(user_id=user.id)
        self.db.add(profile)
        self.db.flush()
        return user

    def save(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.flush()

    def list_all(self, offset: int, limit: int, search: str | None = None):
        stmt = select(User)
        if search:
            stmt = stmt.where(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
        total_count = len(self.db.scalars(stmt).all())
        items = self.db.scalars(stmt.order_by(User.created_at.desc()).offset(offset).limit(limit)).all()
        return items, total_count

    # --- Refresh tokens ---
    def store_refresh_token(self, user_id: int, token_hash: str, expires_at: datetime) -> RefreshToken:
        record = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(record)
        self.db.flush()
        return record

    def get_refresh_token(self, token_hash: str) -> RefreshToken | None:
        return self.db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))

    def revoke_refresh_token(self, token: RefreshToken) -> None:
        token.revoked = True
        self.db.flush()

    def revoke_all_refresh_tokens(self, user_id: int) -> None:
        tokens = self.db.scalars(
            select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
        ).all()
        for t in tokens:
            t.revoked = True
        self.db.flush()

    # --- Password reset ---
    def store_password_reset_token(self, user_id: int, token_hash: str, expires_at: datetime) -> PasswordResetToken:
        record = PasswordResetToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(record)
        self.db.flush()
        return record

    def get_password_reset_token(self, token_hash: str) -> PasswordResetToken | None:
        return self.db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash))

    # --- Email verification ---
    def store_verification_token(self, user_id: int, token_hash: str, expires_at: datetime) -> EmailVerificationToken:
        record = EmailVerificationToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(record)
        self.db.flush()
        return record

    def get_verification_token(self, token_hash: str) -> EmailVerificationToken | None:
        return self.db.scalar(select(EmailVerificationToken).where(EmailVerificationToken.token_hash == token_hash))
