from fastapi import APIRouter

from app.config import settings
from app.dependencies import CurrentAdmin
from app.utils.responses import success_response

router = APIRouter(prefix="/admin/settings", tags=["Admin — Settings"])


@router.get("")
def get_settings(admin: CurrentAdmin):
    return success_response({
        "app_name": settings.APP_NAME, "app_env": settings.APP_ENV,
        "max_resume_size_mb": settings.MAX_RESUME_SIZE_MB, "max_audio_size_mb": settings.MAX_AUDIO_SIZE_MB,
        "max_video_size_mb": settings.MAX_VIDEO_SIZE_MB, "ai_mode": settings.AI_MODE,
    })
