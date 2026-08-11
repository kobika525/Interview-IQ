from pydantic import BaseModel, EmailStr, Field, field_validator

PASSWORD_MIN_LENGTH = 8


def _validate_password_strength(value: str) -> str:
    if len(value) < PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters long.")
    if not any(c.isupper() for c in value):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not any(c.islower() for c in value):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not any(c.isdigit() for c in value):
        raise ValueError("Password must contain at least one number.")
    if not any(not c.isalnum() for c in value):
        raise ValueError("Password must contain at least one special character.")
    return value


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str
    confirm_password: str
    degree: str | None = None
    institute: str | None = None
    study_level: str | None = None
    target_career: str | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember: bool = True


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    account_status: str
    email_verified: bool

    model_config = {"from_attributes": True}


class TokenData(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match.")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr
