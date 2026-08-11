def test_list_career_roles(client, register_and_login):
    headers = register_and_login()
    response = client.get("/api/careers/roles", headers=headers)
    assert response.status_code == 200
    assert "items" in response.json()["data"]


def test_generate_career_matches(client, register_and_login):
    headers = register_and_login()
    response = client.post("/api/careers/matches/generate", headers=headers, json={})
    assert response.status_code == 201
    matches = response.json()["data"]
    assert isinstance(matches, list)


def test_skill_gap_analysis_requires_valid_role(client, register_and_login):
    headers = register_and_login()
    response = client.post("/api/careers/skill-gap", headers=headers, json={"career_role_id": 999999})
    assert response.status_code == 404


def test_career_match_ownership(client, register_and_login):
    headers_a = register_and_login(email="career_a@example.com")
    headers_b = register_and_login(email="career_b@example.com")
    client.post("/api/careers/matches/generate", headers=headers_a, json={})
    matches_a = client.get("/api/careers/matches", headers=headers_a).json()["data"]["items"]
    if matches_a:
        match_id = matches_a[0]["id"]
        response = client.get(f"/api/careers/matches/{match_id}", headers=headers_b)
        assert response.status_code == 403


def test_skill_gap_returns_weighted_facts_and_recommendations(client, register_and_login):
    headers = register_and_login(email="career_gap_quality@example.com")
    roles = client.get("/api/careers/roles", headers=headers).json()["data"]["items"]
    role = next(item for item in roles if item["title"] == "Backend Developer")

    response = client.post("/api/careers/skill-gap", headers=headers, json={
        "career_role_id": role["id"], "additional_skills": ["python"],
        "experience_level": "INTERMEDIATE", "education_level": "Graduate",
        "career_goals": "Become a backend developer",
    })
    assert response.status_code == 201
    result = response.json()["data"]
    assert "Python" in result["matched_skills"]
    assert "SQL" in result["missing_skills"]
    assert 0 <= result["readiness_score"] <= 100
    assert result["score_breakdown"]["requiredSkills"] == 50.0
    assert result["recommendations"]
    assert "provided skills" in result["evidence_sources"]


def test_career_skill_aliases_are_matched_deterministically():
    from app.ai.career.career_matcher import compare_skills

    matched, missing = compare_skills(
        ["JS", "React.js", "REST API"],
        ["JavaScript", "React", "REST APIs", "SQL"],
    )
    assert matched == ["JavaScript", "React", "REST APIs"]
    assert missing == ["SQL"]
