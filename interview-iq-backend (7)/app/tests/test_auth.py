def test_register_success(client):
    response = client.post("/api/auth/register", json={
        "full_name": "Jane Doe", "email": "jane@example.com",
        "password": "SecurePass1!", "confirm_password": "SecurePass1!",
    })
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["user"]["email"] == "jane@example.com"
    assert body["data"]["access_token"]


def test_register_password_validation_error_is_json_serializable(client):
    response = client.post("/api/auth/register", json={
        "email": "weak-password@example.com",
        "password": "lowercase1!",
        "first_name": "Weak",
        "last_name": "Password",
    })

    assert response.status_code == 422
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "One or more fields are invalid."
    assert payload["error"]["code"] == "VALIDATION_ERROR"
    assert isinstance(payload["error"]["details"], list)
    assert any(
        detail.get("ctx", {}).get("error")
        == "Password must contain at least one uppercase letter."
        for detail in payload["error"]["details"]
    )


def test_register_duplicate_email(client):
    payload = {"full_name": "Jane Doe", "email": "dupe@example.com", "password": "SecurePass1!", "confirm_password": "SecurePass1!"}
    client.post("/api/auth/register", json=payload)
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 409


def test_login_success(client):
    payload = {"full_name": "Login User", "email": "login@example.com", "password": "SecurePass1!", "confirm_password": "SecurePass1!"}
    client.post("/api/auth/register", json=payload)
    response = client.post("/api/auth/login", json={"email": "login@example.com", "password": "SecurePass1!"})
    assert response.status_code == 200
    assert response.json()["data"]["access_token"]


def test_login_wrong_password(client):
    payload = {"full_name": "WrongPw User", "email": "wrongpw@example.com", "password": "SecurePass1!", "confirm_password": "SecurePass1!"}
    client.post("/api/auth/register", json=payload)
    response = client.post("/api/auth/login", json={"email": "wrongpw@example.com", "password": "IncorrectPass1!"})
    assert response.status_code == 401


def test_protected_endpoint_requires_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_protected_endpoint_with_token(client, register_and_login):
    headers = register_and_login()
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["data"]["email"] == "pytestuser@example.com"


def test_refresh_token(client):
    payload = {"full_name": "Refresh User", "email": "refresh@example.com", "password": "SecurePass1!", "confirm_password": "SecurePass1!"}
    register_response = client.post("/api/auth/register", json=payload)
    refresh_token = register_response.json()["data"]["refresh_token"]
    response = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert response.json()["data"]["access_token"]


def test_admin_authorization_denied_for_regular_user(client, register_and_login):
    headers = register_and_login()
    response = client.get("/api/admin/dashboard", headers=headers)
    assert response.status_code == 403


def test_forgot_password_does_not_reveal_email_existence(client):
    resp_existing = client.post("/api/auth/forgot-password", json={"email": "nonexistent-user@example.com"})
    assert resp_existing.status_code == 200
    assert resp_existing.json()["success"] is True
