from typing import Annotated

from fastapi import Depends, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import AuthenticationError, ForbiddenError
from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User
from app.utils.enums import AccountStatus, UserRole
from app.utils.pagination import PageParams


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise AuthenticationError("Invalid or expired access token.") from exc

    user = db.get(User, user_id)
    if user is None:
        raise AuthenticationError("User account was not found.")
    if user.account_status != AccountStatus.ACTIVE:
        raise ForbiddenError("Your account is not active. Please contact support.")
    return user


def get_current_admin(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.role != UserRole.ADMIN:
        raise ForbiddenError("Admin privileges are required for this action.")
    return user


def get_pagination(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PageParams:
    return PageParams(page=page, page_size=page_size)


DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentAdmin = Annotated[User, Depends(get_current_admin)]
Pagination = Annotated[PageParams, Depends(get_pagination)]
