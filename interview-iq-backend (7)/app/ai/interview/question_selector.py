"""Selects interview questions for a session. Pure selection/ranking logic —
DB access happens in the repository layer; this module just decides ordering
and how many fallback/generated questions are needed to fill a request."""

import random


def order_questions(questions: list, requested_count: int) -> list:
    """Shuffle for variety and cap to the requested count."""
    pool = list(questions)
    random.shuffle(pool)
    return pool[:requested_count]


def missing_question_count(available: int, requested: int) -> int:
    return max(0, requested - available)
