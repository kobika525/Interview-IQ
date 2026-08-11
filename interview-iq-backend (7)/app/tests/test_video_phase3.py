import os
import subprocess
from pathlib import Path

import imageio_ffmpeg
import fitz
from sqlalchemy import select

from app.ai.video.audio_extractor import extract_audio_track
from app.ai.video.video_signal_analyzer import analyze_video_signals
from app.config import settings
from app.models.interview import InterviewAnswer, SessionQuestion
from app.models.report import InterviewReport
from app.services.storage_service import delete_file


def _create_test_video(path):
    subprocess.run(
        [
            imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-y",
            "-f", "lavfi", "-i", "color=c=gray:s=320x240:d=1",
            "-f", "lavfi", "-i", "sine=frequency=700:duration=1",
            "-shortest", "-c:v", "libx264", "-c:a", "aac", str(path),
        ],
        check=True,
        timeout=60,
    )


def test_ffmpeg_audio_extraction_and_opencv_analysis(tmp_path):
    video_path = tmp_path / "phase3.mp4"
    _create_test_video(video_path)

    audio_path = extract_audio_track(str(video_path))
    try:
        assert os.path.exists(audio_path)
        assert os.path.getsize(audio_path) > 44
    finally:
        os.remove(audio_path)

    signals = analyze_video_signals(str(video_path), max_samples=8)
    assert signals["signals_available"] is True
    assert signals["frames_sampled"] > 0
    assert signals["face_presence_percentage"] == 0
    assert signals["eye_contact_percentage"] is None
    assert signals["camera_framing_score"] is None
    assert signals["visual_presentation_score"] is not None


def test_video_submission_uses_extracted_audio_gemini_and_persists_metrics(
    client, register_and_login, db_session, monkeypatch, tmp_path,
):
    headers = register_and_login("phase3-video@example.com")
    session_response = client.post("/api/interviews", headers=headers, json={
        "interview_type": "TECHNICAL", "mode": "VIDEO", "experience_level": "BEGINNER",
        "difficulty": "BEGINNER", "question_count": 1,
    })
    session_id = session_response.json()["data"]["id"]
    client.post(f"/api/interviews/{session_id}/start", headers=headers)

    extracted_audio = tmp_path / "official.wav"
    extracted_audio.write_bytes(b"RIFF" + b"\0" * 100)
    monkeypatch.setattr(
        "app.services.interview_service.extract_audio_track",
        lambda _path: str(extracted_audio),
    )
    monkeypatch.setattr(
        "app.services.interview_service.transcribe_audio",
        lambda path: {
            "available": True,
            "transcript": "Um, this official Gemini transcript came from extracted video audio.",
            "engine": "gemini",
            "confidence_level": 84.0,
            "fluency": 82.0,
            "pronunciation_quality": 86.0,
            "voice_clarity": 88.0,
        } if path == str(extracted_audio) else {},
    )
    monkeypatch.setattr(
        "app.services.interview_service.analyze_recording",
        lambda *_args: {
            "recording_duration": 30.0, "words_per_minute": 118.0, "speaking_speed": "moderate",
            "average_pause": 0.7, "longest_pause": 1.4, "long_pause_count": 1,
            "filler_word_count": 1, "confidence_level": 84.0, "fluency": 82.0,
            "pronunciation_quality": 86.0, "voice_clarity": 88.0,
            "transcription_engine": "gemini", "word_count": 10,
        },
    )
    video_signals = {
        "signals_available": True, "frames_sampled": 20,
        "eye_contact_percentage": 75.0, "face_detection_percentage": 95.0,
        "head_position_score": 80.0, "forward_facing_percentage": 80.0,
        "looking_away_percentage": 25.0, "smile_percentage": 15.0,
        "face_visibility_percentage": 90.0, "camera_stability_score": 88.0,
        "lighting_quality_score": 79.0, "body_language_confidence_score": 82.0,
        "video_confidence_score": 83.0, "stability_note": "Stable",
    }
    monkeypatch.setattr(
        "app.services.interview_service.analyze_video_signals", lambda _path: video_signals,
    )

    fake_mp4 = b"\x00\x00\x00\x18ftypmp42" + b"\0" * 128
    response = client.post(
        f"/api/interviews/{session_id}/answers/video?question_order=1",
        headers=headers,
        data={"question_order": "1", "transcript": "Ignore this browser preview."},
        files={"file": ("answer.mp4", fake_mp4, "video/mp4")},
    )
    assert response.status_code == 200
    assert response.json()["data"]["video_signals"]["video_confidence_score"] == 83.0
    assert not extracted_audio.exists()

    session_question = db_session.scalar(
        select(SessionQuestion).where(SessionQuestion.session_id == session_id)
    )
    answer = db_session.scalar(
        select(InterviewAnswer).where(InterviewAnswer.session_question_id == session_question.id)
    )
    assert answer.transcript.startswith("Um, this official Gemini transcript")
    assert "Ignore this browser preview" not in answer.transcript
    assert answer.transcription_engine == "gemini"
    assert answer.evaluation.gemini_analysis["overall_answer_score"] == 78.0
    assert answer.video_confidence_score == 83.0
    assert answer.eye_contact_percentage == 75.0

    duplicate = client.post(
        f"/api/interviews/{session_id}/answers/video?question_order=1",
        headers=headers,
        data={"question_order": "1"},
        files={"file": ("duplicate.mp4", fake_mp4, "video/mp4")},
    )
    assert duplicate.status_code == 422

    complete = client.post(f"/api/interviews/{session_id}/complete", headers=headers)
    assert complete.status_code == 200
    report = db_session.scalar(select(InterviewReport).where(InterviewReport.session_id == session_id))
    assert report.video_confidence_score == 83.0
    assert report.face_detection_percentage == 95.0
    assert report.voice_quality_score == 85.0
    assert report.grammar_score == 82.0
    assert report.improved_answers
    assert "must not be used as a hiring decision" in report.hiring_recommendation

    report_response = client.get(f"/api/reports/interviews/{session_id}", headers=headers)
    assert report_response.status_code == 200
    assert report_response.json()["data"]["video_confidence_score"] == 83.0
    assert report_response.json()["data"]["body_language_score"] == 82.0
    assert report_response.json()["data"]["eye_contact_score"] == 75.0

    pdf_response = client.get(f"/api/reports/{report.id}/pdf", headers=headers)
    assert pdf_response.status_code == 200
    document = fitz.open(stream=pdf_response.content, filetype="pdf")
    pdf_text = "\n".join(page.get_text() for page in document)
    document.close()
    assert "Video Presentation Metrics" in pdf_text
    assert "Eye contact (%)" in pdf_text
    assert "Visual Presentation Analysis" in pdf_text
    assert "Improved Answers" in pdf_text
    assert "Mock Interview Readiness" in pdf_text

    pdf_path = os.path.join("uploads", "reports", f"interview_report_{report.id}.pdf")
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    delete_file(answer.video_path)


def test_video_gemini_failure_returns_503_and_cleans_files(
    client, register_and_login, db_session, monkeypatch, tmp_path,
):
    headers = register_and_login("phase3-video-failure@example.com")
    session_id = client.post("/api/interviews", headers=headers, json={
        "interview_type": "TECHNICAL", "mode": "VIDEO", "experience_level": "BEGINNER",
        "difficulty": "BEGINNER", "question_count": 1,
    }).json()["data"]["id"]
    client.post(f"/api/interviews/{session_id}/start", headers=headers)

    extracted_audio = tmp_path / "failed-official.wav"

    def fake_extract(_path):
        extracted_audio.write_bytes(b"RIFF" + b"\0" * 100)
        return str(extracted_audio)

    monkeypatch.setattr("app.services.interview_service.extract_audio_track", fake_extract)
    monkeypatch.setattr(
        "app.services.interview_service.transcribe_audio",
        lambda _path: {
            "available": False,
            "transcript": None,
            "message": "Gemini could not create a valid official transcript. Please try recording again.",
        },
    )

    video_directory = Path(settings.UPLOAD_DIR) / "video"
    before = set(video_directory.glob("*")) if video_directory.exists() else set()
    fake_mp4 = b"\x00\x00\x00\x18ftypmp42" + b"\0" * 128
    response = client.post(
        f"/api/interviews/{session_id}/answers/video?question_order=1",
        headers=headers,
        files={"file": ("gemini-failure.mp4", fake_mp4, "video/mp4")},
    )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "AI_SERVICE_UNAVAILABLE"
    assert not extracted_audio.exists()
    after = set(video_directory.glob("*")) if video_directory.exists() else set()
    assert after == before

    session_question = db_session.scalar(
        select(SessionQuestion).where(SessionQuestion.session_id == session_id)
    )
    assert db_session.scalar(
        select(InterviewAnswer).where(InterviewAnswer.session_question_id == session_question.id)
    ) is None
