from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse

from app.dependencies import CurrentUser, DbSession
from app.schemas.user import OnboardingRequest, ProfileOut, ProfileUpdateRequest
from app.services.user_service import UserService
from app.utils.responses import success_response

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me/profile")
def get_profile(user: CurrentUser, db: DbSession):
    profile = UserService(db).get_profile(user)
    return success_response(ProfileOut.model_validate(profile).model_dump(mode="json"))


@router.patch("/me/profile")
def update_profile(payload: ProfileUpdateRequest, user: CurrentUser, db: DbSession):
    profile = UserService(db).update_profile(user, payload.model_dump(exclude_none=True))
    return success_response(ProfileOut.model_validate(profile).model_dump(mode="json"), "Profile updated")


@router.post("/me/profile-image")
async def upload_profile_image(user: CurrentUser, db: DbSession, file: UploadFile = File(...)):
    content = await file.read()
    profile = UserService(db).upload_profile_image(user, file.filename, content)
    return success_response(ProfileOut.model_validate(profile).model_dump(mode="json"), "Profile image updated")


@router.get("/me/profile-image")
def get_profile_image(user: CurrentUser, db: DbSession):
    path = UserService(db).get_profile_image_path(user)
    return FileResponse(path)


@router.delete("/me/profile-image")
def delete_profile_image(user: CurrentUser, db: DbSession):
    profile = UserService(db).delete_profile_image(user)
    return success_response(ProfileOut.model_validate(profile).model_dump(mode="json"), "Profile image removed")


@router.get("/me/onboarding")
def get_onboarding(user: CurrentUser, db: DbSession):
    return success_response(UserService(db).get_onboarding(user))


@router.put("/me/onboarding")
def update_onboarding(payload: OnboardingRequest, user: CurrentUser, db: DbSession):
    result = UserService(db).update_onboarding(user, payload.model_dump(exclude_none=True))
    return success_response(result, "Onboarding progress saved")


@router.post("/me/onboarding/complete")
def complete_onboarding(user: CurrentUser, db: DbSession):
    result = UserService(db).complete_onboarding(user)
    return success_response(result, "Onboarding completed")


@router.delete("/me")
def delete_account(user: CurrentUser, db: DbSession):
    UserService(db).delete_account(user)
    return success_response(None, "Account deleted")
