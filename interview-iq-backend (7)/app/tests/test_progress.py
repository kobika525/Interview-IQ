def test_progress_dashboard_empty_state(client, register_and_login):
    headers = register_and_login()
    response = client.get("/api/progress/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_interviews"] == 0
    assert data["average_score"] == 0.0
    assert data["latest_interview_score"] == 0.0
    assert data["skill_breakdown"] == []
    assert data["voice_metrics"] == {}
    assert data["video_metrics"] == {}
    assert data["improvement_timeline"] == []
    assert data["ai_feedback"] == {"summary": "", "strengths": [], "improvements": [], "tips": []}


def test_progress_dashboard_after_completed_interview(client, register_and_login):
    headers = register_and_login()
    session = client.post("/api/interviews", headers=headers, json={
        "interview_type": "TECHNICAL", "mode": "TEXT", "difficulty": "BEGINNER", "question_count": 1,
    }).json()["data"]
    client.post(f"/api/interviews/{session['id']}/start", headers=headers)
    client.post(f"/api/interviews/{session['id']}/answers/text", headers=headers, json={
        "question_order": 1, "answer_text": "A complete, well-structured technical answer.",
    })
    client.post(f"/api/interviews/{session['id']}/complete", headers=headers)

    response = client.get("/api/progress/dashboard", headers=headers)
    data = response.json()["data"]
    assert data["total_interviews"] == 1
    assert data["average_score"] > 0
    assert data["latest_interview_score"] == data["average_score"]
    assert {item["skill"] for item in data["skill_breakdown"]} == {
        "Technical", "Communication", "Grammar", "Confidence", "Problem solving", "Relevance",
    }
    assert data["communication_score"] > 0
    assert data["grammar_score"] > 0
    assert data["confidence_score"] > 0
    assert data["ai_feedback"]["summary"]
    assert data["career_suggestions"]
    assert len(data["improvement_timeline"]) == 1
    assert set(data["improvement_timeline"][0]) == {
        "label", "overall", "technical", "communication", "grammar", "confidence",
    }
