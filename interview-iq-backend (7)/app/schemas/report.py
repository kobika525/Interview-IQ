from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class QuestionBreakdownItem(BaseModel):
    question: str
    user_answer: str | None
    score: float
    feedback: str
    expected_keywords: list[str]
    matched_keywords: list[str]
    missing_keywords: list[str]
    model_answer: str | None
    improvement_suggestion: str | None
    recording_duration_seconds: float | None = None
    words_per_minute: float | None = None
    speaking_speed: str | None = None
    average_pause_seconds: float | None = None
    longest_pause_seconds: float | None = None
    long_pause_count: int | None = None
    filler_word_count: int | None = None
    voice_confidence_score: float | None = None
    voice_fluency_score: float | None = None
    pronunciation_quality_score: float | None = None
    voice_clarity_score: float | None = None
    transcription_engine: str | None = None
    eye_contact_percentage: float | None = None
    face_detection_percentage: float | None = None
    head_position_score: float | None = None
    forward_facing_percentage: float | None = None
    looking_away_percentage: float | None = None
    smile_percentage: float | None = None
    face_visibility_percentage: float | None = None
    camera_stability_score: float | None = None
    lighting_quality_score: float | None = None
    body_language_confidence_score: float | None = None
    video_confidence_score: float | None = None
    recording_stability_note: str | None = None
    visual_metrics: dict | None = None


class ReportOut(ORMModel):
    id: int
    session_id: int
    overall_score: float
    performance_label: str
    communication_score: float
    technical_score: float
    problem_solving_score: float
    confidence_score: float
    relevance_score: float
    structure_score: float
    professionalism_score: float
    grammar_score: float | None = None
    voice_quality_score: float | None = None
    speaking_wpm: float | None
    filler_word_count: int | None
    long_pause_count: int | None
    speech_clarity_score: float | None
    recording_duration_seconds: float | None = None
    speaking_speed: str | None = None
    average_pause_seconds: float | None = None
    longest_pause_seconds: float | None = None
    voice_confidence_score: float | None = None
    voice_fluency_score: float | None = None
    pronunciation_quality_score: float | None = None
    face_visibility_percentage: float | None
    forward_facing_percentage: float | None
    recording_stability_note: str | None = None
    eye_contact_percentage: float | None = None
    face_detection_percentage: float | None = None
    head_position_score: float | None = None
    looking_away_percentage: float | None = None
    smile_percentage: float | None = None
    camera_stability_score: float | None = None
    lighting_quality_score: float | None = None
    body_language_confidence_score: float | None = None
    video_confidence_score: float | None = None
    visual_metrics: dict | None = None
    executive_summary: str
    strengths: list[str]
    growth_areas: list[str]
    interview_tips: list[str] = []
    career_advice: list[str] = []
    suggested_learning_resources: list[str] = []
    improved_answers: list[str] = []
    ai_suggestions: list[str] = []
    career_guidance: list[str] = []
    body_language_score: float | None = None
    eye_contact_score: float | None = None
    hiring_recommendation: str | None = None
    weight_version: str
    model_disclaimer: str
    created_at: datetime
    question_breakdown: list[QuestionBreakdownItem] = []
