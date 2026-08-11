from app.core.exceptions import PayloadTooLargeError, UnsupportedMediaTypeError

# Magic-byte signatures so we never trust a file extension alone.
_SIGNATURES: dict[str, list[bytes]] = {
    "pdf": [b"%PDF-"],
    "docx": [b"PK\x03\x04"],  # docx/zip container
    "webm": [b"\x1a\x45\xdf\xa3"],
    "wav": [b"RIFF"],
    "mp3": [b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"],
    "mp4": [b"\x00\x00\x00", b"ftyp"],  # loosely checked (see is_valid_mp4)
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
    "webp": [b"RIFF"],
}

ALLOWED_RESUME_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_AUDIO_EXTENSIONS = {".webm", ".wav", ".mp3"}
ALLOWED_VIDEO_EXTENSIONS = {".webm", ".mp4"}
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def _extension_of(filename: str) -> str:
    return "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _matches_signature(header: bytes, kind: str) -> bool:
    if kind == "mp4":
        return b"ftyp" in header[:32]
    if kind == "webp":
        return header.startswith(b"RIFF") and header[8:12] == b"WEBP"
    return any(header.startswith(sig) for sig in _SIGNATURES.get(kind, []))


def validate_upload(
    filename: str,
    content: bytes,
    allowed_extensions: set[str],
    max_size_mb: int,
    kind_map: dict[str, str],
) -> str:
    """
    Validates extension + magic bytes + size.
    `kind_map` maps extension (without dot) -> signature key, e.g. {"pdf": "pdf"}.
    Returns the validated extension (without dot).
    """
    ext = _extension_of(filename)
    if ext not in allowed_extensions:
        raise UnsupportedMediaTypeError(f"File type '{ext or 'unknown'}' is not supported.")

    size_mb = len(content) / (1024 * 1024)
    if size_mb > max_size_mb:
        raise PayloadTooLargeError(f"File exceeds the maximum size of {max_size_mb}MB.")

    kind = kind_map.get(ext.lstrip("."))
    if kind and not _matches_signature(content[:64], kind):
        raise UnsupportedMediaTypeError("The file content doesn't match its extension.")

    return ext.lstrip(".")


def validate_resume_upload(filename: str, content: bytes, max_size_mb: int) -> str:
    return validate_upload(
        filename, content, ALLOWED_RESUME_EXTENSIONS, max_size_mb, {"pdf": "pdf", "docx": "docx"}
    )


def validate_audio_upload(filename: str, content: bytes, max_size_mb: int) -> str:
    return validate_upload(
        filename, content, ALLOWED_AUDIO_EXTENSIONS, max_size_mb,
        {"webm": "webm", "wav": "wav", "mp3": "mp3"},
    )


def validate_video_upload(filename: str, content: bytes, max_size_mb: int) -> str:
    return validate_upload(
        filename, content, ALLOWED_VIDEO_EXTENSIONS, max_size_mb, {"webm": "webm", "mp4": "mp4"}
    )


def validate_upload_path(
    filename: str, path: str, allowed_extensions: set[str], max_size_mb: int, kind_map: dict[str, str],
) -> str:
    """File-backed equivalent of ``validate_upload`` for streamed media."""
    import os

    ext = _extension_of(filename)
    if ext not in allowed_extensions:
        raise UnsupportedMediaTypeError(f"File type '{ext or 'unknown'}' is not supported.")
    if os.path.getsize(path) > max_size_mb * 1024 * 1024:
        raise PayloadTooLargeError(f"File exceeds the maximum size of {max_size_mb}MB.")
    with open(path, "rb") as source:
        header = source.read(64)
    kind = kind_map.get(ext.lstrip("."))
    if kind and not _matches_signature(header, kind):
        raise UnsupportedMediaTypeError("The file content doesn't match its extension.")
    return ext.lstrip(".")


def validate_audio_path(filename: str, path: str, max_size_mb: int) -> str:
    return validate_upload_path(
        filename, path, ALLOWED_AUDIO_EXTENSIONS, max_size_mb,
        {"webm": "webm", "wav": "wav", "mp3": "mp3"},
    )


def validate_video_path(filename: str, path: str, max_size_mb: int) -> str:
    return validate_upload_path(
        filename, path, ALLOWED_VIDEO_EXTENSIONS, max_size_mb, {"webm": "webm", "mp4": "mp4"},
    )
