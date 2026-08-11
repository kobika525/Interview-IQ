"""File storage abstraction. Local filesystem today; swap the implementation
for S3/Cloudinary later without touching callers — they only ever see a
`storage_key` (relative path), never a raw absolute filesystem path."""

import os
import shutil

from app.config import settings
from app.utils.filenames import safe_stored_filename

SUBDIRS = {"resume": "resumes", "audio": "audio", "video": "video", "report": "reports", "profile_image": "profile_images"}


def _ensure_dir(category: str) -> str:
    directory = os.path.join(settings.UPLOAD_DIR, SUBDIRS[category])
    os.makedirs(directory, exist_ok=True)
    return directory


def save_bytes(content: bytes, original_filename: str, category: str) -> dict:
    directory = _ensure_dir(category)
    stored_name = safe_stored_filename(original_filename)
    absolute_path = os.path.join(directory, stored_name)

    with open(absolute_path, "wb") as out_file:
        out_file.write(content)

    storage_key = os.path.join(SUBDIRS[category], stored_name)
    return {
        "storage_key": storage_key,
        "stored_filename": stored_name,
        "absolute_path": absolute_path,
        "file_size": len(content),
    }


def save_file(source_path: str, original_filename: str, category: str) -> dict:
    """Copy a streamed temporary upload without loading it into memory."""
    directory = _ensure_dir(category)
    stored_name = safe_stored_filename(original_filename)
    absolute_path = os.path.join(directory, stored_name)
    try:
        with open(source_path, "rb") as source, open(absolute_path, "wb") as destination:
            shutil.copyfileobj(source, destination, length=1024 * 1024)
    except Exception:
        if os.path.exists(absolute_path):
            os.remove(absolute_path)
        raise
    return {
        "storage_key": os.path.join(SUBDIRS[category], stored_name),
        "stored_filename": stored_name,
        "absolute_path": absolute_path,
        "file_size": os.path.getsize(absolute_path),
    }


def resolve_path(storage_key: str) -> str:
    """Turns a stored relative key back into a real path, guarding against
    path traversal (the caller-facing API never exposes this value directly)."""
    full_path = os.path.normpath(os.path.join(settings.UPLOAD_DIR, storage_key))
    upload_root = os.path.normpath(settings.UPLOAD_DIR)
    if not full_path.startswith(upload_root):
        raise ValueError("Invalid storage key.")
    return full_path


def delete_file(storage_key: str) -> None:
    path = resolve_path(storage_key)
    if os.path.exists(path):
        os.remove(path)
