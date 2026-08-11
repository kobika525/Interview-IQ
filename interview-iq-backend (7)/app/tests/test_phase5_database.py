from sqlalchemy import select

from app.models.interview import AnswerEvaluation, InterviewAnswer, InterviewSession, SessionQuestion
from app.models.report import InterviewReport
from app.services.storage_service import delete_file


def _create_session(client, headers, mode):
    response = client.post("/api/interviews", headers=headers, json={
        "interview_type": "TECHNICAL", "mode": mode, "experience_level": "BEGINNER",
        "difficulty": "BEGINNER", "question_count": 1,
    })
    assert response.status_code == 201
    session_id = response.json()["data"]["id"]
    assert client.post(f"/api/interviews/{session_id}/start", headers=headers).status_code == 200
    return session_id


def test_text_interview_archives_question_gemini_analysis_and_later_report_access(
    client, register_and_login, db_session,
):
    email = "phase5-history@example.com"
    password = "TestPass123!"
    headers = register_and_login(email, password)
    session_id = _create_session(client, headers, "TEXT")

    session_question = db_session.scalar(
        select(SessionQuestion).where(SessionQuestion.session_id == session_id)
    )
    archived_question = session_question.question_snapshot
    assert archived_question == session_question.question.question_text

    submitted_answer = "I would clarify requirements, design secure REST resources, and test the trade-offs."
    response = client.post(f"/api/interviews/{session_id}/answers/text", headers=headers, json={
        "question_order": 1, "answer_text": submitted_answer,
    })
    assert response.status_code == 200
    assert client.post(f"/api/interviews/{session_id}/complete", headers=headers).status_code == 200

    answer = db_session.scalar(
        select(InterviewAnswer).where(InterviewAnswer.session_question_id == session_question.id)
    )
    evaluation = db_session.scalar(
        select(AnswerEvaluation).where(AnswerEvaluation.answer_id == answer.id)
    )
    report = db_session.scalar(
        select(InterviewReport).where(InterviewReport.session_id == session_id)
    )
    session = db_session.get(InterviewSession, session_id)

    assert answer.answer_text == submitted_answer
    assert answer.transcript is None
    assert answer.submitted_at is not None
    assert evaluation.evaluation_provider == "gemini"
    assert evaluation.gemini_analysis["overall_answer_score"] == evaluation.overall_score
    assert evaluation.gemini_analysis["strengths"] == evaluation.strengths
    assert evaluation.gemini_analysis["weaknesses"] == evaluation.weaknesses
    assert evaluation.gemini_analysis["improved_answer"] == evaluation.model_answer
    assert evaluation.gemini_analysis["career_advice"] == evaluation.career_advice
    assert evaluation.created_at is not None
    assert report.overall_score == evaluation.overall_score
    assert report.strengths == evaluation.strengths
    assert report.growth_areas == evaluation.weaknesses
    assert report.interview_tips == evaluation.interview_tips
    assert report.improved_answers == [evaluation.model_answer]
    assert report.career_advice == evaluation.career_advice
    assert report.created_at is not None
    assert session.completed_at is not None

    # A later admin edit to the reusable question bank must not rewrite history.
    session_question.question.question_text = "A changed question-bank value"
    db_session.commit()

    later_login = client.post("/api/auth/login", json={"email": email, "password": password})
    later_headers = {"Authorization": f"Bearer {later_login.json()['data']['access_token']}"}
    history = client.get("/api/interviews", headers=later_headers).json()["data"]["items"]
    archived_session = next(item for item in history if item["id"] == session_id)
    assert archived_session["has_report"] is True
    assert archived_session["report_id"] == report.id
    assert archived_session["overall_score"] == report.overall_score

    historical_report = client.get(f"/api/reports/interviews/{session_id}", headers=later_headers)
    assert historical_report.status_code == 200
    breakdown = historical_report.json()["data"]["question_breakdown"]
    assert breakdown[0]["question"] == archived_question
    assert breakdown[0]["user_answer"] == submitted_answer
    assert breakdown[0]["gemini_analysis"]["evaluation_provider"] == "gemini"


def test_voice_interview_persists_transcript_metrics_and_report(
    client, register_and_login, db_session, monkeypatch,
):
    headers = register_and_login("phase5-voice@example.com")
    session_id = _create_session(client, headers, "VOICE")
    transcript = "Um, I would clarify the requirements and then compare the technical trade-offs."
    monkeypatch.setattr(
        "app.services.interview_service.transcribe_audio",
        lambda _path: {
            "available": True, "transcript": transcript, "engine": "gemini",
            "confidence_level": 84.0, "fluency": 82.0,
            "pronunciation_quality": 86.0, "voice_clarity": 88.0,
        },
    )
    monkeypatch.setattr(
        "app.services.interview_service.analyze_recording",
        lambda *_args: {
            "recording_duration": 30.0, "words_per_minute": 118.0, "speaking_speed": "moderate",
            "average_pause": 0.7, "longest_pause": 1.4, "long_pause_count": 1,
            "filler_word_count": 1, "confidence_level": 84.0, "fluency": 82.0,
            "pronunciation_quality": 86.0, "voice_clarity": 88.0,
            "transcription_engine": "gemini", "word_count": 12,
        },
    )

    fake_webm = b"\x1a\x45\xdf\xa3" + b"\0" * 128
    response = client.post(
        f"/api/interviews/{session_id}/answers/audio?question_order=1",
        headers=headers,
        files={"file": ("phase5.webm", fake_webm, "audio/webm")},
    )
    assert response.status_code == 200
    assert client.post(f"/api/interviews/{session_id}/complete", headers=headers).status_code == 200

    session_question = db_session.scalar(
        select(SessionQuestion).where(SessionQuestion.session_id == session_id)
    )
    answer = db_session.scalar(
        select(InterviewAnswer).where(InterviewAnswer.session_question_id == session_question.id)
    )
    evaluation = db_session.scalar(select(AnswerEvaluation).where(AnswerEvaluation.answer_id == answer.id))
    report = db_session.scalar(select(InterviewReport).where(InterviewReport.session_id == session_id))

    assert answer.transcript == transcript
    assert answer.transcription_engine == "gemini"
    assert answer.recording_duration_seconds == 30.0
    assert answer.words_per_minute == 118.0
    assert answer.filler_word_count == 1
    assert answer.voice_confidence_score == 84.0
    assert answer.voice_fluency_score == 82.0
    assert answer.pronunciation_quality_score == 86.0
    assert answer.voice_clarity_score == 88.0
    assert evaluation.gemini_analysis["overall_answer_score"] == 78.0
    assert report.voice_quality_score == 85.0
    assert report.speaking_wpm == 118.0
    delete_file(answer.audio_path)
