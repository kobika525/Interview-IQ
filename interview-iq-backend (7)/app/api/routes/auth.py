from fastapi import APIRouter, status

from app.dependencies import CurrentUser, DbSession
from app.schemas.auth import (
    ChangePasswordRequest, ForgotPasswordRequest, LoginRequest, LogoutRequest, RefreshRequest,
    RegisterRequest, ResendVerificationRequest, ResetPasswordRequest, UserOut,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthService
from app.utils.responses import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _token_payload(user, access, refresh) -> dict:
    from app.config import settings

    return {
        "access_token": access, "refresh_token": refresh, "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserOut.model_validate(user).model_dump(mode="json") | {"role": user.role.value, "account_status": user.account_status.value},
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: DbSession):
    service = AuthService(db)
    user, access, refresh = service.register(payload)
    return success_response(_token_payload(user, access, refresh), "Account created successfully")


@router.post("/login")
def login(payload: LoginRequest, db: DbSession):
    service = AuthService(db)
    user, access, refresh = service.login(payload.email, payload.password)
    return success_response(_token_payload(user, access, refresh), "Login successful")


@router.post("/refresh")
def refresh(payload: RefreshRequest, db: DbSession):
    service = AuthService(db)
    user, access, refresh_token = service.refresh(payload.refresh_token)
    return success_response(_token_payload(user, access, refresh_token), "Token refreshed")


@router.post("/logout")
def logout(payload: LogoutRequest, db: DbSession):
    AuthService(db).logout(payload.refresh_token)
    return success_response(None, "Logged out successfully")


@router.post("/logout-all")
def logout_all(db: DbSession, user: CurrentUser):
    AuthService(db).logout_all(user.id)
    return success_response(None, "Logged out from all devices")


@router.get("/me")
def me(user: CurrentUser):
    data = UserOut.model_validate(user).model_dump(mode="json") | {"role": user.role.value, "account_status": user.account_status.value}
    return success_response(data)


@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: DbSession):
    AuthService(db).verify_email(payload.token)
    return success_response(None, "Email verified successfully")


@router.post("/resend-verification")
def resend_verification(payload: ResendVerificationRequest, db: DbSession):
    AuthService(db).resend_verification(payload.email)
    return success_response(None, "If an account exists for this email, a verification link has been sent.")


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: DbSession):
    AuthService(db).forgot_password(payload.email)
    return success_response(None, "If an account exists for this email, a reset link has been sent.")


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: DbSession):
    AuthService(db).reset_password(payload.token, payload.new_password)
    return success_response(None, "Password reset successfully")


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, db: DbSession, user: CurrentUser):
    AuthService(db).change_password(user, payload.current_password, payload.new_password)
    return success_response(None, "Password changed successfully")
