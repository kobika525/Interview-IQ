import re
import secrets
from pathlib import PurePosixPath


def safe_stored_filename(original_filename: str) -> str:
    """Generates a random, collision-safe filename while preserving the extension."""
    suffix = PurePosixPath(original_filename or "").suffix.lower()
    suffix = re.sub(r"[^a-z0-9.]", "", suffix)[:10]
    return f"{secrets.token_hex(16)}{suffix}"


def sanitize_display_filename(original_filename: str) -> str:
    """Strips path components and unsafe characters, for display/storage metadata only."""
    name = PurePosixPath(original_filename or "file").name
    return re.sub(r"[^A-Za-z0-9._ -]", "_", name)[:255]
