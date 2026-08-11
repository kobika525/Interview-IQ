from typing import Any

from app.utils.pagination import Page


def success_response(data: Any = None, message: str = "Operation completed successfully") -> dict:
    return {"success": True, "message": message, "data": data}


def list_response(page: Page, message: str = "Records retrieved successfully") -> dict:
    return {"success": True, "message": message, "data": page.to_dict()}


def error_response(message: str, code: str = "APP_ERROR", details: list | None = None, request_id: str | None = None) -> dict:
    return {
        "success": False,
        "message": message,
        "error": {"code": code, "details": details or []},
        "request_id": request_id,
    }
