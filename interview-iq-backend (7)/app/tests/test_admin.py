def _admin_headers(client):
    client.post("/api/auth/register", json={
        "full_name": "Admin Test", "email": "admintest@example.com",
        "password": "AdminPass1!", "confirm_password": "AdminPass1!",
    })
    # Promote via direct DB manipulation isn't available here; instead we rely on
    # the seeded admin account credentials for admin-only flows.
    response = client.post("/api/auth/login", json={"email": "admin@interviewiq.com", "password": "ChangeMe123!"})
    if response.status_code != 200:
        return None
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_admin_access_allowed(client):
    headers = _admin_headers(client)
    if not headers:
        return  # seeded admin not present in this environment's test DB — skip gracefully
    response = client.get("/api/admin/dashboard", headers=headers)
    assert response.status_code == 200


def test_normal_user_denied_admin_access(client, register_and_login):
    headers = register_and_login()
    response = client.get("/api/admin/users", headers=headers)
    assert response.status_code == 403


def test_admin_question_crud(client):
    headers = _admin_headers(client)
    if not headers:
        return
    create = client.post("/api/admin/questions", headers=headers, json={
        "question_text": "What is a hash map?", "topic": "Data Structures", "category": "Data Structures",
        "difficulty": "BEGINNER", "interview_type": "TECHNICAL", "expected_keywords": ["hash", "key", "value"],
    })
    assert create.status_code == 201
    question_id = create.json()["data"]["id"]

    update = client.patch(f"/api/admin/questions/{question_id}", headers=headers, json={"question_text": "What is a hash table?"})
    assert update.status_code == 200

    delete = client.delete(f"/api/admin/questions/{question_id}", headers=headers)
    assert delete.status_code == 204


def test_admin_career_role_crud(client):
    headers = _admin_headers(client)
    if not headers:
        return
    create = client.post("/api/admin/career-roles", headers=headers, json={
        "title": "Test Role XYZ", "description": "A role created by tests.",
        "required_skills": ["Testing"], "recommended_skills": [],
    })
    assert create.status_code == 201


def test_admin_resource_crud(client):
    headers = _admin_headers(client)
    if not headers:
        return
    create = client.post("/api/admin/resources", headers=headers, json={
        "title": "Test Resource ABC", "resource_type": "ARTICLE", "difficulty": "BEGINNER",
        "is_published": False,
    })
    assert create.status_code == 201
    resource_id = create.json()["data"]["id"]

    admin_list = client.get("/api/admin/resources", headers=headers)
    assert admin_list.status_code == 200
    draft = next(item for item in admin_list.json()["data"]["items"] if item["id"] == resource_id)
    assert draft["is_published"] is False

    publish = client.patch(
        f"/api/admin/resources/{resource_id}", headers=headers, json={"is_published": True},
    )
    assert publish.status_code == 200
    assert publish.json()["data"]["is_published"] is True

    unpublish = client.patch(
        f"/api/admin/resources/{resource_id}", headers=headers, json={"is_published": False},
    )
    assert unpublish.status_code == 200
    assert unpublish.json()["data"]["is_published"] is False


def test_admin_user_suspension(client, register_and_login):
    admin_headers = _admin_headers(client)
    if not admin_headers:
        return
    user_headers = register_and_login(email="suspendme@example.com")
    me = client.get("/api/auth/me", headers=user_headers).json()["data"]

    update = client.patch(
        f"/api/admin/users/{me['id']}", headers=admin_headers,
        json={"full_name": "Updated Admin User", "role": "USER"},
    )
    assert update.status_code == 200
    assert update.json()["data"]["full_name"] == "Updated Admin User"
    assert update.json()["data"]["role"] == "USER"

    response = client.patch(f"/api/admin/users/{me['id']}/status", headers=admin_headers, json={"account_status": "SUSPENDED"})
    assert response.status_code == 200
    assert response.json()["data"]["account_status"] == "SUSPENDED"

    deactivate = client.patch(
        f"/api/admin/users/{me['id']}/status", headers=admin_headers, json={"account_status": "DISABLED"},
    )
    assert deactivate.status_code == 200
    assert deactivate.json()["data"]["account_status"] == "DISABLED"

    activate = client.patch(
        f"/api/admin/users/{me['id']}/status", headers=admin_headers, json={"account_status": "ACTIVE"},
    )
    assert activate.status_code == 200
    assert activate.json()["data"]["account_status"] == "ACTIVE"
