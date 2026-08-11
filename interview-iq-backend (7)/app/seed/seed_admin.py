"""Idempotent — running twice will not create duplicate admin accounts."""

from app.config import settings
from app.core.security import hash_password
from app.database import SessionLocal
from app.models.user import User
from app.utils.enums import AccountStatus, UserRole


def run():
    with SessionLocal() as db:
        existing = db.query(User).filter(User.email == settings.ADMIN_SEED_EMAIL.lower()).first()
        if existing:
            changed = False
            if existing.role != UserRole.ADMIN:
                existing.role = UserRole.ADMIN
                changed = True
            if existing.account_status != AccountStatus.ACTIVE:
                existing.account_status = AccountStatus.ACTIVE
                changed = True
            if not existing.email_verified:
                existing.email_verified = True
                changed = True
            if changed:
                db.commit()
                print(f"[seed_admin] Promoted existing account to admin: {settings.ADMIN_SEED_EMAIL}")
            else:
                print(f"[seed_admin] Admin already exists: {settings.ADMIN_SEED_EMAIL}")
            return

        from app.models.profile import UserProfile

        admin = User(
            full_name="Interview IQ Admin", email=settings.ADMIN_SEED_EMAIL.lower(),
            password_hash=hash_password(settings.ADMIN_SEED_PASSWORD),
            role=UserRole.ADMIN, account_status=AccountStatus.ACTIVE, email_verified=True,
        )
        db.add(admin)
        db.flush()
        db.add(UserProfile(user_id=admin.id))
        db.commit()
        print(f"[seed_admin] Created admin: {settings.ADMIN_SEED_EMAIL} (password from ADMIN_SEED_PASSWORD env var)")


if __name__ == "__main__":
    run()
