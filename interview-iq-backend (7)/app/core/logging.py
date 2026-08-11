import logging
import sys

from app.config import settings


def configure_logging() -> None:
    root = logging.getLogger()
    if root.handlers:
        return  # already configured (e.g. under pytest re-imports)

    root.setLevel(settings.LOG_LEVEL)
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    root.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
