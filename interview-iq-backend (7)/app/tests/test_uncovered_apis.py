from app.models.job import ProcessingJob
from app.utils.enums import JobStatus, JobType
from app.main import app


def _admin_headers(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@interviewiq.com", "password": "ChangeMe123!"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['data']['access_token']}"}


def test_skills_endpoints(client, register_and_login):
    headers = register_and_login("skills@example.com")

    response = client.get("/api/skills", headers=headers)
    assert response.status_code == 200
    assert response.json()["data"]

    response = client.post(
        "/api/skills/me",
        headers=headers,
        json={"name": "FastAPI", "proficiency": "INTERMEDIATE"},
    )
    assert response.status_code == 201

    response = client.get("/api/skills/me", headers=headers)
    assert response.status_code == 200
    assert any(row["skill"]["name"] == "FastAPI" for row in response.json()["data"])


def test_support_ticket_full_flow(client, register_and_login):
    headers = register_and_login("support@example.com")
    created = client.post(
        "/api/support/tickets",
        headers=headers,
        json={"subject": "Login problem", "category": "TECHNICAL", "message": "I cannot log in."},
    )
    assert created.status_code == 201
    ticket_id = created.json()["data"]["id"]

    assert client.get("/api/support/tickets", headers=headers).status_code == 200
    assert client.get(f"/api/support/tickets/{ticket_id}", headers=headers).status_code == 200
    assert client.post(
        f"/api/support/tickets/{ticket_id}/messages",
        headers=headers,
        json={"message": "This is still happening."},
    ).status_code == 200
    assert client.patch(f"/api/support/tickets/{ticket_id}/close", headers=headers).status_code == 200

    admin_headers = _admin_headers(client)
    assert client.get("/api/admin/support/tickets", headers=admin_headers).status_code == 200
    assert client.patch(
        f"/api/admin/support/tickets/{ticket_id}",
        headers=admin_headers,
        json={"status": "CLOSED"},
    ).status_code == 200


def test_subscription_billing_notifications_and_achievements(client, register_and_login):
    headers = register_and_login("billing@example.com")

    assert client.get("/api/subscriptions/current", headers=headers).status_code == 200
    assert client.get("/api/subscriptions/usage", headers=headers).status_code == 200

    upgraded = client.post(
        "/api/subscriptions/demo-upgrade",
        headers=headers,
        json={"plan_code": "premium", "billing_cycle": "month"},
    )
    assert upgraded.status_code == 201

    invoices = client.get("/api/billing/invoices", headers=headers)
    assert invoices.status_code == 200
    invoice_id = invoices.json()["data"]["items"][0]["id"]
    assert client.get(f"/api/billing/invoices/{invoice_id}", headers=headers).status_code == 200

    notifications = client.get("/api/notifications", headers=headers)
    assert notifications.status_code == 200
    notification_id = notifications.json()["data"]["items"][0]["id"]
    assert client.get("/api/notifications/unread-count", headers=headers).json()["data"]["count"] >= 1
    assert client.patch(f"/api/notifications/{notification_id}/read", headers=headers).status_code == 200
    assert client.patch("/api/notifications/read-all", headers=headers).status_code == 200
    assert client.delete(f"/api/notifications/{notification_id}", headers=headers).status_code == 204

    assert client.get("/api/achievements", headers=headers).status_code == 200
    assert client.post("/api/subscriptions/cancel", headers=headers).status_code == 200
    assert client.post("/api/subscriptions/reactivate", headers=headers).status_code == 200


def test_processing_job_get_retry_and_ownership(client, register_and_login, db_session):
    headers = register_and_login("jobs@example.com")
    user_id = client.get("/api/auth/me", headers=headers).json()["data"]["id"]
    job = ProcessingJob(
        user_id=user_id,
        job_type=JobType.RESUME_ANALYSIS,
        entity_type="resume",
        entity_id=1,
        status=JobStatus.FAILED,
        progress=50,
        error_message="Temporary failure",
    )
    db_session.add(job)
    db_session.commit()

    assert client.get(f"/api/jobs/{job.id}", headers=headers).status_code == 200
    retried = client.post(f"/api/jobs/{job.id}/retry", headers=headers)
    assert retried.status_code == 200
    assert retried.json()["data"]["status"] == "PENDING"

    other_headers = register_and_login("jobs-other@example.com")
    assert client.get(f"/api/jobs/{job.id}", headers=other_headers).status_code == 403


def test_admin_analytics_reports_and_settings(client):
    headers = _admin_headers(client)
    paths = [
        "/api/admin/dashboard",
        "/api/admin/analytics/users",
        "/api/admin/analytics/interviews",
        "/api/admin/analytics/resumes",
        "/api/admin/analytics/subscriptions",
        "/api/admin/analytics/resources",
        "/api/admin/reports/interviews",
        "/api/admin/reports/resumes",
        "/api/admin/settings",
        "/api/admin/subscriptions",
        "/api/admin/subscription-plans",
    ]
    for path in paths:
        response = client.get(path, headers=headers)
        assert response.status_code == 200, f"{path}: {response.text}"


def test_reports_empty_and_missing_states(client, register_and_login):
    headers = register_and_login("reports@example.com")
    assert client.get("/api/reports", headers=headers).status_code == 200
    assert client.get("/api/reports/999999", headers=headers).status_code == 404
    response = client.get("/api/reports/interviews/999999", headers=headers)
    assert response.status_code in (200, 404)


def test_every_registered_api_operation_handles_requests_without_server_errors(
    client, register_and_login
):
    """Contract smoke test for every operation, including invalid-input paths.

    Feature tests above exercise valid workflows. This additionally guarantees
    that every registered operation handles missing/invalid resources and
    payloads as a controlled 4xx response rather than crashing with a 500.
    """
    user_headers = register_and_login("all-routes@example.com")
    admin_headers = _admin_headers(client)
    checked = []

    operations = []
    for route in app.routes:
        if not hasattr(route, "path"):
            continue
        if not route.path.startswith("/api") and route.path not in {"/health"}:
            continue
        for method in sorted(route.methods or []):
            if method in {"HEAD", "OPTIONS"}:
                continue
            operations.append((route.path, method))

    # Account deletion is valid but must be last because later authenticated
    # requests would correctly stop working after the user is deleted.
    operations.sort(key=lambda operation: operation == ("/api/users/me", "DELETE"))

    for route_path, method in operations:
        path = route_path
        for parameter in route_path.split("{")[1:]:
            name = parameter.split("}")[0]
            value = "1" if name in {"question_order"} else "999999"
            path = path.replace("{" + name + "}", value)

        if path.startswith("/api/admin"):
            headers = admin_headers
        elif path in {"/health", "/api/health", "/api/ready", "/api/openapi.json"}:
            headers = {}
        else:
            headers = user_headers

        kwargs = {"headers": headers}
        if method in {"POST", "PUT", "PATCH"}:
            kwargs["json"] = {}
        response = client.request(method, path, **kwargs)
        assert response.status_code < 500, (
            f"{method} {route_path} returned {response.status_code}: {response.text}"
        )
        checked.append((method, route_path))

    expected = {
        (method, route.path)
        for route in app.routes
        if hasattr(route, "path")
        if route.path.startswith("/api") or route.path == "/health"
        for method in (route.methods or [])
        if method not in {"HEAD", "OPTIONS"}
    }
    assert set(checked) == expected
