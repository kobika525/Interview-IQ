from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel
from app.utils.enums import Difficulty, ExperienceLevel, InterviewMode, InterviewType


class InterviewSetupRequest(BaseModel):
    target_role_id: int | None = None
    interview_type: InterviewType = InterviewType.MIXED
    mode: InterviewMode = InterviewMode.TEXT
    experience_level: ExperienceLevel = ExperienceLevel.BEGINNER
    difficulty: Difficulty = Difficulty.BEGINNER
    duration_minutes: int = 20
    question_count: int = Field(default=5, ge=1, le=15)
    question_categories: list[str] = []
    resume_id: int | None = None
    job_description: str | None = None
    preferred_language: str = "en"


class QuestionOut(BaseModel):
    id: int
    order_number: int
    question_text: str
    topic: str
    category: str
    difficulty: str
    interview_type: str
    is_skipped: bool = False
    is_answered: bool = False


class SessionOut(ORMModel):
    id: int
    mode: str
    interview_type: str
    difficulty: str
    experience_level: str
    status: str
    requested_question_count: int
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    questions: list[QuestionOut] = []


class TextAnswerRequest(BaseModel):
    question_order: int
    answer_text: str = Field(min_length=1)


class SkipQuestionRequest(BaseModel):
    question_order: int


class AnswerEvaluationOut(BaseModel):
    overall_score: float | None = None
    technical_accuracy: float | None = None
    communication: float | None = None
    confidence: float | None = None
    grammar: float | None = None
    fluency: float | None = None
    relevance: float | None = None
    problem_solving: float | None = None
    strengths: list[str] = []
    weaknesses: list[str] = []
    improved_answer: str | None = None
    interview_tips: list[str] = []
    career_advice: list[str] = []
    suggested_learning_resources: list[str] = []
    follow_up_question: str | None = None
    evaluation_provider: str | None = None
    evaluation_model: str | None = None
    relevance_score: float
    technical_score: float
    communication_score: float
    structure_score: float
    star_score: float | None
    keyword_coverage: float
    matched_keywords: list[str]
    missing_keywords: list[str]
    feedback: str
    model_answer: str | None
    improvement_suggestion: str | None


class SubmitAnswerResponse(BaseModel):
    session_status: str
    evaluation: AnswerEvaluationOut
    next_question: QuestionOut | None


class InterviewStatusOut(BaseModel):
    session_id: int
    status: str
    answered_count: int
    total_count: int
