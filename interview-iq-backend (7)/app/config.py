from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Interview IQ"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True

    API_V1_PREFIX: str = "/api"

    SECRET_KEY: str = "replace_with_a_long_random_secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/interview_iq"
    DATABASE_NAME_OVERRIDE: str = ""
    TEST_DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/interview_iq_test"

    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    UPLOAD_DIR: str = "uploads"
    MAX_RESUME_SIZE_MB: int = 10
    MAX_AUDIO_SIZE_MB: int = 50
    MAX_VIDEO_SIZE_MB: int = 250

    AI_MODE: str = "local"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    OLLAMA_TIMEOUT_SECONDS: int = 120

    # Optional cloud AI providers — used only if Ollama is unreachable and one of these is set.
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    WHISPER_MODEL: str = "base"
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"
    SPACY_MODEL: str = "en_core_web_sm"

    FFMPEG_PATH: str = "ffmpeg"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@interviewiq.local"

    PAYMENT_MODE: str = "demo"
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_SUCCESS_URL: str = "http://localhost:5173/app/checkout?payment=success&session_id={CHECKOUT_SESSION_ID}"
    STRIPE_CANCEL_URL: str = "http://localhost:5173/app/checkout?payment=cancelled"
    PAYHERE_SANDBOX: bool = True
    PAYHERE_MERCHANT_ID: str = ""
    PAYHERE_MERCHANT_SECRET: str = ""
    PAYHERE_APP_ID: str = ""
    PAYHERE_APP_SECRET: str = ""
    PAYHERE_CURRENCY: str = "LKR"
    PAYHERE_RETURN_URL: str = "http://localhost:8000/api/subscriptions/payhere/return?order_id={ORDER_ID}"
    PAYHERE_CANCEL_URL: str = "http://localhost:8000/api/subscriptions/payhere/cancel?order_id={ORDER_ID}"
    PAYHERE_NOTIFY_URL: str = ""
    PAYHERE_COUNTRY: str = "Sri Lanka"

    RATE_LIMIT_ENABLED: bool = False
    LOG_LEVEL: str = "INFO"

    ADMIN_SEED_EMAIL: str = "admin@interviewiq.com"
    ADMIN_SEED_PASSWORD: str = "ChangeMe123!"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def effective_database_url(self) -> str:
        if not self.DATABASE_NAME_OVERRIDE:
            return self.DATABASE_URL
        return make_url(self.DATABASE_URL).set(database=self.DATABASE_NAME_OVERRIDE).render_as_string(hide_password=False)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
