"""Deterministic tests for local visual-presentation measurements."""

import cv2
import numpy as np

from app.ai.video.video_signal_analyzer import (
    DISCLAIMER, VisualAnalysisConfig, analyze_video_signals,
    calculate_visual_presentation_score,
)


class FakeCapture:
    def __init__(self, frames, opened=True):
        self.frames = frames
        self.index = 0
        self.opened = opened

    def isOpened(self): return self.opened
    def get(self, _prop): return len(self.frames)
    def set(self, *_args): return True
    def read(self):
        if self.index >= len(self.frames): return False, None
        frame = self.frames[self.index]; self.index += 1
        return True, frame
    def release(self): pass


class FakeCascade:
    def __init__(self, detections): self.detections = list(detections); self.index = 0
    def empty(self): return False
    def detectMultiScale(self, *_args, **_kwargs):
        value = self.detections[min(self.index, len(self.detections) - 1)] if self.detections else []
        self.index += 1
        return np.array(value, dtype=np.int32)


def run_analysis(monkeypatch, faces, eyes=None, brightness=128, config=None):
    frames = [np.full((240, 320, 3), brightness, dtype=np.uint8) for _ in faces]
    models = iter([FakeCascade(faces), FakeCascade(eyes or [[] for _ in faces])])
    monkeypatch.setattr(cv2, "VideoCapture", lambda _path: FakeCapture(frames))
    monkeypatch.setattr(cv2, "CascadeClassifier", lambda _path: next(models))
    return analyze_video_signals("fixture.mp4", config=config)


def test_no_face_is_not_scored_as_good(monkeypatch):
    result = run_analysis(monkeypatch, [[]] * 5)
    assert result["face_presence_percentage"] == 0
    assert result["eye_contact_percentage"] is None
    assert result["camera_framing_score"] is None
    assert result["visual_presentation_score"] < 75


def test_single_face_presence_and_correct_framing(monkeypatch):
    face = [[(110, 55, 100, 120)]]
    eyes = [[(20, 20, 15, 10), (60, 20, 15, 10)]]
    result = run_analysis(monkeypatch, face * 5, eyes * 5)
    assert result["face_frames"] == 5
    assert result["face_presence_percentage"] == 100
    assert result["eye_contact_percentage"] == 100
    assert result["camera_framing_status"] == "good"


def test_multiple_face_warning_uses_threshold(monkeypatch):
    two = [(30, 50, 80, 100), (190, 50, 80, 100)]
    result = run_analysis(monkeypatch, [two] * 3 + [[]] * 2)
    assert result["multiple_face_frame_count"] == 3
    assert result["multiple_face_percentage"] == 60
    assert result["multiple_face_warning"] is True


def test_dark_and_overexposed_statuses(monkeypatch):
    assert run_analysis(monkeypatch, [[]] * 4, brightness=20)["lighting_status"] == "too_dark"
    assert run_analysis(monkeypatch, [[]] * 4, brightness=245)["lighting_status"] == "overexposed"


def test_specific_framing_guidance(monkeypatch):
    far_left = [[(2, 70, 30, 35)]]
    result = run_analysis(monkeypatch, far_left * 4)
    assert "Move closer to the camera." in result["camera_framing_guidance"]
    assert "Move right to centre your face." in result["camera_framing_guidance"]


def test_head_stability_and_excessive_movement(monkeypatch):
    stable = [[(110, 55, 100, 120)]] * 5
    assert run_analysis(monkeypatch, stable)["head_stability_score"] == 100
    moving = [[(20, 55, 80, 100)], [(210, 55, 80, 100)]] * 3
    result = run_analysis(monkeypatch, moving)
    assert result["excessive_movement_count"] > 0
    assert result["head_stability_status"] == "needs_improvement"


def test_eye_contact_unavailable_without_enough_evidence(monkeypatch):
    face = [[(110, 55, 100, 120)]] * 3
    result = run_analysis(monkeypatch, face, [[(20, 20, 10, 8), (60, 20, 10, 8)], [], []])
    assert result["valid_eye_contact_frames"] == 1
    assert result["eye_contact_percentage"] is None
    assert result["eye_contact_status"] == "unavailable"


def test_short_and_corrupt_video_are_safe(monkeypatch):
    result = run_analysis(monkeypatch, [[(110, 55, 100, 120)]])
    assert result["analyzed_frame_count"] == 1
    assert result["head_stability_score"] is None
    monkeypatch.setattr(cv2, "VideoCapture", lambda _path: FakeCapture([], opened=False))
    corrupt = analyze_video_signals("corrupt.mp4")
    assert corrupt["signals_available"] is False
    assert corrupt["visual_presentation_score"] is None


def test_score_reweights_unavailable_components():
    score, used = calculate_visual_presentation_score({
        "face_presence": 100, "camera_engagement": None, "head_stability": 50,
        "lighting": None, "camera_framing": 100, "multiple_face_compliance": 100,
    })
    assert score == 88.5
    assert "camera_engagement" not in used
    assert DISCLAIMER.startswith("This score evaluates visible")


def test_thresholds_are_configurable(monkeypatch):
    config = VisualAnalysisConfig(dark_brightness=10, overexposed_brightness=250)
    result = run_analysis(monkeypatch, [[]] * 3, brightness=20, config=config)
    assert result["lighting_status"] == "acceptable"
