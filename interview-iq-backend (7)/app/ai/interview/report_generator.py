"""Aggregates persisted Gemini evaluations into an interview report."""


def performance_label(overall_score: float) -> str:
    if overall_score >= 85:
        return "Excellent"
    if overall_score >= 70:
        return "Strong"
    if overall_score >= 55:
        return "Developing"
    return "Needs Practice"


def readiness_recommendation(overall_score: float) -> str:
    """Advisory mock-interview readiness, never an employment decision."""
    if overall_score >= 85:
        guidance = "Strong mock-interview readiness; continue targeted role-specific practice."
    elif overall_score >= 70:
        guidance = "Promising mock-interview readiness with a few focused improvements recommended."
    elif overall_score >= 55:
        guidance = "Developing mock-interview readiness; additional practice is recommended before a real interview."
    else:
        guidance = "More structured practice is recommended before a real interview."
    return f"{guidance} This is preparation guidance only and must not be used as a hiring decision."


def aggregate_report(evaluations: list[dict], voice_signals: dict | None = None, video_signals: dict | None = None) -> dict:
    if not evaluations:
        raise ValueError("Cannot generate a report with zero evaluated answers.")

    def avg(key: str) -> float:
        values = [evaluation[key] for evaluation in evaluations if evaluation.get(key) is not None]
        return round(sum(values) / len(values), 1) if values else 0.0

    def unique_items(key: str) -> list[str]:
        return list(dict.fromkeys(
            item for evaluation in evaluations for item in evaluation.get(key, []) if item
        ))

    overall = avg("overall_answer_score")
    communication = avg("communication_score")
    technical = avg("technical_score")
    structure = avg("structure_score")
    confidence = avg("confidence_score")
    professionalism = avg("professionalism_score")
    grammar = avg("grammar_score")
    relevance = avg("relevance_score")
    problem_solving = avg("problem_solving_score")
    strengths = unique_items("strengths")
    growth_areas = unique_items("weaknesses")
    interview_tips = unique_items("interview_tips")
    career_advice = unique_items("career_advice")
    learning_resources = unique_items("suggested_learning_resources")
    improved_answers = list(dict.fromkeys(
        evaluation["improved_answer"]
        for evaluation in evaluations
        if evaluation.get("improved_answer")
    ))

    focus = growth_areas[0] if growth_areas else "maintaining consistent answer quality"
    summary = (
        f"You scored an overall {overall}/100 across {len(evaluations)} questions, "
        f"with particular strength in {'communication' if communication >= technical else 'technical depth'}. "
        f"Focus your next session on {focus.lower()}"
    )

    report = {
        "overall_score": overall,
        "performance_label": performance_label(overall),
        "communication_score": communication,
        "technical_score": technical,
        "problem_solving_score": problem_solving,
        "confidence_score": confidence,
        "relevance_score": relevance,
        "structure_score": structure,
        "professionalism_score": professionalism,
        "grammar_score": grammar,
        "executive_summary": summary,
        "strengths": strengths,
        "growth_areas": growth_areas,
        "interview_tips": interview_tips,
        "career_advice": career_advice,
        "suggested_learning_resources": learning_resources,
        "improved_answers": improved_answers,
        "hiring_recommendation": readiness_recommendation(overall),
    }
    if voice_signals:
        voice_quality_values = [
            value for value in (
                voice_signals.get("voice_clarity"),
                voice_signals.get("fluency"),
                voice_signals.get("pronunciation_quality"),
                voice_signals.get("confidence_level"),
            ) if value is not None
        ]
        report.update({
            "speaking_wpm": voice_signals.get("words_per_minute"),
            "recording_duration_seconds": voice_signals.get("recording_duration"),
            "speaking_speed": voice_signals.get("speaking_speed"),
            "average_pause_seconds": voice_signals.get("average_pause"),
            "longest_pause_seconds": voice_signals.get("longest_pause"),
            "filler_word_count": voice_signals.get("filler_word_count"),
            "long_pause_count": voice_signals.get("long_pause_count"),
            "speech_clarity_score": voice_signals.get("voice_clarity"),
            "voice_confidence_score": voice_signals.get("confidence_level"),
            "voice_fluency_score": voice_signals.get("fluency"),
            "pronunciation_quality_score": voice_signals.get("pronunciation_quality"),
            "voice_quality_score": (
                round(sum(voice_quality_values) / len(voice_quality_values), 1)
                if voice_quality_values else None
            ),
        })
    if video_signals:
        report.update({
            "eye_contact_percentage": video_signals.get("eye_contact_percentage"),
            "face_detection_percentage": video_signals.get("face_detection_percentage"),
            "head_position_score": video_signals.get("head_position_score"),
            "looking_away_percentage": video_signals.get("looking_away_percentage"),
            "smile_percentage": video_signals.get("smile_percentage"),
            "face_visibility_percentage": video_signals.get("face_visibility_percentage"),
            "forward_facing_percentage": video_signals.get("forward_facing_percentage"),
            "camera_stability_score": video_signals.get("camera_stability_score"),
            "lighting_quality_score": video_signals.get("lighting_quality_score"),
            "body_language_confidence_score": video_signals.get("body_language_confidence_score"),
            "video_confidence_score": video_signals.get("video_confidence_score"),
            "recording_stability_note": (
                video_signals.get("recording_stability_note") or video_signals.get("stability_note")
            ),
        })
    return report
