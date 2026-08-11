def _create_session(client, headers, question_count=2):
    return client.post("/api/interviews", headers=headers, json={
        "interview_type": "TECHNICAL", "mode": "TEXT", "experience_level": "BEGINNER",
        "difficulty": "BEGINNER", "question_count": question_count,
    })


def test_create_session(client, register_and_login):
    headers = register_and_login()
    response = _create_session(client, headers)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["status"] == "CREATED"
    assert len(data["questions"]) == 2


def test_start_session(client, register_and_login):
    headers = register_and_login()
    session_id = _create_session(client, headers).json()["data"]["id"]
    response = client.post(f"/api/interviews/{session_id}/start", headers=headers)
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "IN_PROGRESS"


def test_submit_text_answer_and_evaluation(client, register_and_login):
    headers = register_and_login()
    session_id = _create_session(client, headers).json()["data"]["id"]
    client.post(f"/api/interviews/{session_id}/start", headers=headers)

    response = client.post(f"/api/interviews/{session_id}/answers/text", headers=headers, json={
        "question_order": 1, "answer_text": "I would approach this by first understanding requirements, then designing a solution with clear trade-offs.",
    })
    assert response.status_code == 200
    data = response.json()["data"]
    assert "evaluation" in data
    assert 0 <= data["evaluation"]["relevance_score"] <= 100


def test_duplicate_text_submission_is_blocked(client, register_and_login):
    headers = register_and_login("duplicate-text@example.com")
    session_id = _create_session(client, headers, question_count=1).json()["data"]["id"]
    client.post(f"/api/interviews/{session_id}/start", headers=headers)
    payload = {"question_order": 1, "answer_text": "A sufficiently detailed interview answer."}
    assert client.post(f"/api/interviews/{session_id}/answers/text", headers=headers, json=payload).status_code == 200
    duplicate = client.post(f"/api/interviews/{session_id}/answers/text", headers=headers, json=payload)
    assert duplicate.status_code == 422
    assert duplicate.json()["message"] == "This question has already been answered."


def test_gemini_failure_rolls_back_text_answer(client, register_and_login, db_session, monkeypatch):
    headers = register_and_login("gemini-text-failure@example.com")
    session_id = _create_session(client, headers, question_count=1).json()["data"]["id"]
    client.post(f"/api/interviews/{session_id}/start", headers=headers)

    def unavailable(**_kwargs):
        raise AIServiceError("Gemini is temporarily unavailable.")

    monkeypatch.setattr("app.services.interview_service.evaluate_answer", unavailable)
    response = client.post(f"/api/interviews/{session_id}/answers/text", headers=headers, json={
        "question_order": 1, "answer_text": "This answer must not be saved without an evaluation.",
    })
    assert response.status_code == 503
    session_question = db_session.scalar(select(SessionQuestion).where(SessionQuestion.session_id == session_id))
    assert db_session.scalar(
        select(InterviewAnswer).where(InterviewAnswer.session_question_id == session_question.id)
    ) is None


def test_session_questions_use_snapshot_after_question_bank_edit(client, register_and_login, db_session):
    headers = register_and_login("stable-questions@example.com")
    created = _create_session(client, headers, question_count=1).json()["data"]
    original = created["questions"][0]["question_text"]
    question = db_session.get(InterviewQuestion, created["questions"][0]["id"])
    question.question_text = "A later admin edit that must not alter the active session."
    db_session.commit()

    refreshed = client.get(f"/api/interviews/{created['id']}", headers=headers).json()["data"]
    assert refreshed["questions"][0]["question_text"] == original


def test_skip_question(client, register_and_login):
    headers = register_and_login()
    session_id = _create_session(client, headers).json()["data"]["id"]
    client.post(f"/api/interviews/{session_id}/start", headers=headers)
    response = client.post(f"/api/interviews/{session_id}/questions/1/skip", headers=headers, json={"question_order": 1})
    assert response.status_code == 200


def test_complete_session_generates_report(client, register_and_login):
    headers = register_and_login()
    session_id = _create_session(client, headers, question_count=1).json()["data"]["id"]
    client.post(f"/api/interviews/{session_id}/start", headers=headers)
    client.post(f"/api/interviews/{session_id}/answers/text", headers=headers, json={
        "question_order": 1, "answer_text": "A thorough, well-structured answer explaining my technical approach step by step.",
    })
    response = client.post(f"/api/interviews/{session_id}/complete", headers=headers)
    assert response.status_code == 200
    assert "report_id" in response.json()["data"]


def test_complete_session_with_no_answers_fails(client, register_and_login):
    headers = register_and_login()
    session_id = _create_session(client, headers).json()["data"]["id"]
    client.post(f"/api/interviews/{session_id}/start", headers=headers)
    response = client.post(f"/api/interviews/{session_id}/complete", headers=headers)
    assert response.status_code == 422


def test_completion_rejects_non_gemini_evaluation(client, register_and_login, db_session):
    headers = register_and_login("non-gemini-completion@example.com")
    session_id = _create_session(client, headers, question_count=1).json()["data"]["id"]
    client.post(f"/api/interviews/{session_id}/start", headers=headers)
    client.post(f"/api/interviews/{session_id}/answers/text", headers=headers, json={
        "question_order": 1, "answer_text": "A valid answer that is initially evaluated by Gemini.",
    })
    evaluation = db_session.scalar(select(AnswerEvaluation).join(InterviewAnswer).join(SessionQuestion).where(
        SessionQuestion.session_id == session_id
    ))
    evaluation.evaluation_provider = "legacy"
    evaluation.gemini_analysis = None
    db_session.commit()

    response = client.post(f"/api/interviews/{session_id}/complete", headers=headers)
    assert response.status_code == 422
    assert "valid Gemini evaluation" in response.json()["message"]


def test_session_ownership_enforced(client, register_and_login):
    headers_a = register_and_login(email="iv_a@example.com")
    headers_b = register_and_login(email="iv_b@example.com")
    session_id = _create_session(client, headers_a).json()["data"]["id"]
    response = client.get(f"/api/interviews/{session_id}", headers=headers_b)
    assert response.status_code == 403


def test_invalid_state_transition(client, register_and_login):
    """Cannot complete a session that was never started."""
    headers = register_and_login()
    session_id = _create_session(client, headers).json()["data"]["id"]
    response = client.post(f"/api/interviews/{session_id}/answers/text", headers=headers, json={
        "question_order": 1, "answer_text": "Answer before starting.",
    })
    assert response.status_code == 422


def test_free_plan_allows_two_video_interviews(client, register_and_login):
    headers = register_and_login()
    payload = {
        "interview_type": "TECHNICAL", "mode": "VIDEO", "experience_level": "BEGINNER",
        "difficulty": "BEGINNER", "question_count": 1,
    }
    assert client.post("/api/interviews", headers=headers, json=payload).status_code == 201
    assert client.post("/api/interviews", headers=headers, json=payload).status_code == 201
    assert client.post("/api/interviews", headers=headers, json=payload).status_code == 403
from sqlalchemy import select

from app.core.exceptions import AIServiceError
from app.models.interview import AnswerEvaluation, InterviewAnswer, InterviewQuestion, SessionQuestion
