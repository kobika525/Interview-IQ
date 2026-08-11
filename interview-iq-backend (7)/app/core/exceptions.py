from fastapi import status


class AppError(Exception):
    """Base application error. Carries an HTTP status and a safe user-facing message."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    error_code: str = "APP_ERROR"

    def __init__(self, message: str = "Something went wrong.", details: list | None = None):
        self.message = message
        self.details = details or []
        super().__init__(message)


class ValidationAppError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    error_code = "VALIDATION_ERROR"


class AuthenticationError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "AUTHENTICATION_ERROR"

    def __init__(self, message: str = "Invalid authentication credentials."):
        super().__init__(message)


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "FORBIDDEN"

    def __init__(self, message: str = "You don't have permission to perform this action."):
        super().__init__(message)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "NOT_FOUND"

    def __init__(self, message: str = "The requested resource was not found."):
        super().__init__(message)


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    error_code = "CONFLICT"

    def __init__(self, message: str = "This resource already exists or conflicts with an existing one."):
        super().__init__(message)


class PayloadTooLargeError(AppError):
    status_code = status.HTTP_413_CONTENT_TOO_LARGE
    error_code = "PAYLOAD_TOO_LARGE"

    def __init__(self, message: str = "The uploaded file is too large."):
        super().__init__(message)


class UnsupportedMediaTypeError(AppError):
    status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    error_code = "UNSUPPORTED_MEDIA_TYPE"

    def __init__(self, message: str = "This file type is not supported."):
        super().__init__(message)


class UsageLimitError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "USAGE_LIMIT_REACHED"

    def __init__(self, message: str = "You've reached your plan's usage limit for this feature."):
        super().__init__(message)


class RateLimitError(AppError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    error_code = "RATE_LIMITED"

    def __init__(self, message: str = "Too many requests. Please try again shortly."):
        super().__init__(message)


class AIServiceError(AppError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    error_code = "AI_SERVICE_UNAVAILABLE"

    def __init__(self, message: str = "The AI evaluation service is temporarily unavailable."):
        super().__init__(message)
