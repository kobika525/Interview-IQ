def test_generate_roadmap(client, register_and_login):
    headers = register_and_login()
    roles = client.get("/api/careers/roles", headers=headers).json()["data"]["items"]
    assert roles, "Expected seeded career roles to be present"
    role_id = roles[0]["id"]

    response = client.post("/api/roadmaps/generate", headers=headers, json={"career_role_id": role_id})
    assert response.status_code == 201
    data = response.json()["data"]
    assert len(data["items"]) > 0


def test_complete_roadmap_item_updates_progress(client, register_and_login):
    headers = register_and_login()
    role_id = client.get("/api/careers/roles", headers=headers).json()["data"]["items"][0]["id"]
    roadmap = client.post("/api/roadmaps/generate", headers=headers, json={"career_role_id": role_id}).json()["data"]
    item_id = roadmap["items"][0]["id"]

    response = client.post(f"/api/roadmaps/{roadmap['id']}/items/{item_id}/complete", headers=headers)
    assert response.status_code == 200
    assert response.json()["data"]["is_completed"] is True

    updated_roadmap = client.get(f"/api/roadmaps/{roadmap['id']}", headers=headers).json()["data"]
    assert updated_roadmap["completion_percentage"] > 0


def test_resource_bookmark_flow(client, register_and_login):
    headers = register_and_login()
    resources = client.get("/api/resources", headers=headers).json()["data"]["items"]
    assert resources
    resource_id = resources[0]["id"]

    bookmark = client.post(f"/api/resources/{resource_id}/bookmark", headers=headers)
    assert bookmark.status_code == 201

    bookmarks = client.get("/api/resources/bookmarks", headers=headers).json()["data"]["items"]
    assert any(r["id"] == resource_id for r in bookmarks)
