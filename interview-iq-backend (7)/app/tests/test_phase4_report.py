from app.ai.interview.report_generator import aggregate_report


def _evaluation():
    return {
        "overall_answer_score": 78.0,
        "communication_score": 76.0,
        "technical_score": 80.0,
        "structure_score": 82.0,
        "grammar_score": 84.0,
        "confidence_score": 74.0,
        "professionalism_score": 84.0,
        "relevance_score": 81.0,
        "problem_solving_score": 77.0,
        "strengths": ["Explains the approach clearly."],
        "weaknesses": ["Could quantify the expected impact."],
        "interview_tips": ["State assumptions before choosing the design."],
        "career_advice": ["Practice system-design trade-off discussions."],
        "suggested_learning_resources": ["Official REST API design documentation"],
        "improved_answer": "Clarify requirements, compare options, and validate the chosen trade-offs.",
    }


def test_phase4_aggregate_merges_gemini_voice_and_video_analysis():
    report = aggregate_report(
        [_evaluation()],
        voice_signals={
            "words_per_minute": 120.0, "recording_duration": 30.0, "speaking_speed": "moderate",
            "average_pause": 0.6, "longest_pause": 1.2, "filler_word_count": 1,
            "long_pause_count": 1, "voice_clarity": 88.0, "confidence_level": 84.0,
            "fluency": 82.0, "pronunciation_quality": 86.0,
        },
        video_signals={
            "eye_contact_percentage": 75.0, "face_detection_percentage": 95.0,
            "head_position_score": 80.0, "looking_away_percentage": 25.0,
            "smile_percentage": 15.0, "face_visibility_percentage": 90.0,
            "forward_facing_percentage": 80.0, "camera_stability_score": 88.0,
            "lighting_quality_score": 79.0, "body_language_confidence_score": 82.0,
            "video_confidence_score": 83.0, "recording_stability_note": "Stable",
        },
    )

    assert report["overall_score"] == 78.0
    assert report["technical_score"] == 80.0
    assert report["grammar_score"] == 84.0
    assert report["voice_quality_score"] == 85.0
    assert report["body_language_confidence_score"] == 82.0
    assert report["eye_contact_percentage"] == 75.0
    assert report["strengths"] == ["Explains the approach clearly."]
    assert report["growth_areas"] == ["Could quantify the expected impact."]
    assert report["improved_answers"] == [
        "Clarify requirements, compare options, and validate the chosen trade-offs."
    ]
    assert report["interview_tips"] == ["State assumptions before choosing the design."]
    assert report["career_advice"] == ["Practice system-design trade-off discussions."]
    assert "must not be used as a hiring decision" in report["hiring_recommendation"]


def test_phase4_text_report_api_exposes_comprehensive_fields(client, register_and_login):
    headers = register_and_login("phase4-report@example.com")
    session_id = client.post("/api/interviews", headers=headers, json={
        "interview_type": "TECHNICAL", "mode": "TEXT", "experience_level": "BEGINNER",
        "difficulty": "BEGINNER", "question_count": 1,
    }).json()["data"]["id"]
    client.post(f"/api/interviews/{session_id}/start", headers=headers)
    client.post(f"/api/interviews/{session_id}/answers/text", headers=headers, json={
        "question_order": 1,
        "answer_text": "I would clarify requirements, define resources, secure endpoints, and test trade-offs.",
    })
    assert client.post(f"/api/interviews/{session_id}/complete", headers=headers).status_code == 200

    response = client.get(f"/api/reports/interviews/{session_id}", headers=headers)
    assert response.status_code == 200
    report = response.json()["data"]
    assert report["overall_score"] == 78.0
    assert report["technical_score"] == 80.0
    assert report["grammar_score"] == 82.0
    assert report["voice_quality_score"] is None
    assert report["strengths"] == ["Explains the approach clearly."]
    assert report["growth_areas"] == ["Could quantify the expected impact."]
    assert report["improved_answers"]
    assert report["ai_suggestions"] == ["State assumptions before choosing the design."]
    assert report["career_guidance"] == ["Practice system-design trade-off discussions."]
    assert "preparation guidance only" in report["hiring_recommendation"]
