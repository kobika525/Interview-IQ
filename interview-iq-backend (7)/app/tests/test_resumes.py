import io

from reportlab.pdfgen import canvas


def _make_pdf_bytes(text_lines):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    y = 800
    for line in text_lines:
        c.drawString(50, y, line)
        y -= 15
    c.save()
    buffer.seek(0)
    return buffer.read()


def test_upload_valid_pdf(client, register_and_login):
    headers = register_and_login()
    pdf_bytes = _make_pdf_bytes([
        "Jane Doe", "jane@example.com", "SUMMARY", "Backend engineer.",
        "EXPERIENCE", "Software Engineer, Acme (2022-Present)", "- Built REST APIs with Python",
        "EDUCATION", "BSc Computer Science", "SKILLS", "Python, SQL, Git",
    ])
    response = client.post(
        "/api/resumes", headers=headers,
        files={"file": ("resume.pdf", pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 201
    assert response.json()["data"]["status"] == "UPLOADED"


def test_upload_invalid_file_type_rejected(client, register_and_login):
    headers = register_and_login()
    response = client.post(
        "/api/resumes", headers=headers,
        files={"file": ("resume.exe", b"not a real resume", "application/octet-stream")},
    )
    assert response.status_code in (400, 415, 422)


def test_analyze_resume_produces_scores(client, register_and_login):
    headers = register_and_login()
    pdf_bytes = _make_pdf_bytes([
        "Jane Doe", "jane@example.com", "555-123-4567", "SUMMARY", "Backend engineer with API experience.",
        "EXPERIENCE", "Software Engineer, Acme (2022-Present)", "- Built REST APIs with Python and SQL",
        "EDUCATION", "BSc Computer Science", "SKILLS", "Python, SQL, Git, REST APIs",
        "PROJECTS", "- Built a small API service",
    ])
    upload = client.post("/api/resumes", headers=headers, files={"file": ("resume.pdf", pdf_bytes, "application/pdf")})
    resume_id = upload.json()["data"]["id"]

    response = client.post(f"/api/resumes/{resume_id}/analyze", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert 0 <= data["overall_score"] <= 100
    assert "strengths" in data and "suggestions" in data

    history_response = client.get("/api/resumes", headers=headers)
    assert history_response.status_code == 200
    history = history_response.json()["data"]["items"]
    saved_resume = next(item for item in history if item["id"] == resume_id)
    assert saved_resume["latest_analysis"] is not None
    assert saved_resume["latest_analysis"]["overall_score"] == data["overall_score"]
    assert len(saved_resume["latest_analysis"]["skills_found"]) == len(data["skills_found"])


def test_resume_ownership_enforced(client, register_and_login):
    headers_a = register_and_login(email="resume_a@example.com")
    headers_b = register_and_login(email="resume_b@example.com")
    pdf_bytes = _make_pdf_bytes(["Jane Doe", "SUMMARY", "Engineer."])
    upload = client.post("/api/resumes", headers=headers_a, files={"file": ("resume.pdf", pdf_bytes, "application/pdf")})
    resume_id = upload.json()["data"]["id"]

    response = client.get(f"/api/resumes/{resume_id}", headers=headers_b)
    assert response.status_code == 403
