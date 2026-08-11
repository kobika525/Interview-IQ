def test_read_profile(client, register_and_login):
    headers = register_and_login()
    response = client.get("/api/users/me/profile", headers=headers)
    assert response.status_code == 200
    assert "onboarding_completed" in response.json()["data"]


def test_update_profile(client, register_and_login):
    headers = register_and_login()
    response = client.patch("/api/users/me/profile", headers=headers, json={"bio": "Aspiring backend engineer."})
    assert response.status_code == 200
    assert response.json()["data"]["bio"] == "Aspiring backend engineer."


def test_upload_read_and_delete_profile_image(client, register_and_login):
    headers = register_and_login()
    png = b"\x89PNG\r\n\x1a\n" + b"profile-image-test"

    uploaded = client.post(
        "/api/users/me/profile-image",
        headers=headers,
        files={"file": ("avatar.png", png, "image/png")},
    )
    assert uploaded.status_code == 200
    assert uploaded.json()["data"]["avatar_path"]

    image = client.get("/api/users/me/profile-image", headers=headers)
    assert image.status_code == 200
    assert image.content == png

    removed = client.delete("/api/users/me/profile-image", headers=headers)
    assert removed.status_code == 200
    assert removed.json()["data"]["avatar_path"] is None
    assert client.get("/api/users/me/profile-image", headers=headers).status_code == 404


def test_onboarding_flow(client, register_and_login):
    headers = register_and_login()
    response = client.put("/api/users/me/onboarding", headers=headers, json={"career_goal": "Land my first job", "step": 1})
    assert response.status_code == 200
    assert response.json()["data"]["step"] == 1

    complete = client.post("/api/users/me/onboarding/complete", headers=headers)
    assert complete.status_code == 200
    assert complete.json()["data"]["completed"] is True


def test_profile_is_owned_by_current_user_only(client, register_and_login):
    headers_a = register_and_login(email="usera@example.com")
    headers_b = register_and_login(email="userb@example.com")
    resp_a = client.patch("/api/users/me/profile", headers=headers_a, json={"bio": "User A bio"})
    resp_b = client.get("/api/users/me/profile", headers=headers_b)
    assert resp_a.json()["data"]["bio"] == "User A bio"
    assert resp_b.json()["data"]["bio"] != "User A bio"
