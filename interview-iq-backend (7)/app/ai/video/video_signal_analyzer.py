"""Bounded, local OpenCV analysis of visible presentation conditions."""

from dataclasses import dataclass
import logging
import math
import time

import cv2

logger = logging.getLogger("app.ai.video")
DISCLAIMER = (
    "This score evaluates visible interview-presentation conditions and does not "
    "measure personality, emotion, honesty, or hiring suitability."
)


@dataclass(frozen=True)
class VisualAnalysisConfig:
    max_samples: int = 60
    max_processing_seconds: float = 30.0
    max_analysis_width: int = 480
    dark_brightness: float = 55.0
    overexposed_brightness: float = 220.0
    lighting_warning_percentage: float = 30.0
    multiple_face_warning_percentage: float = 10.0
    min_eye_evidence_frames: int = 3
    min_face_area_ratio: float = 0.035
    max_face_area_ratio: float = 0.38
    centre_x: tuple[float, float] = (0.35, 0.65)
    centre_y: tuple[float, float] = (0.25, 0.65)
    excessive_movement_distance: float = 0.10


def _pct(part: int, total: int) -> float | None:
    return round(100.0 * part / total, 1) if total else None


def _status(value: float | None) -> str:
    if value is None:
        return "unavailable"
    return "good" if value >= 75 else "fair" if value >= 50 else "needs_improvement"


def calculate_visual_presentation_score(components: dict[str, float | None]) -> tuple[float | None, list[str]]:
    """Reweight only valid components; unavailable signals are never scored as zero."""
    weights = {"face_presence": .20, "camera_engagement": .20, "head_stability": .15,
               "lighting": .15, "camera_framing": .20, "multiple_face_compliance": .10}
    valid = {key: value for key, value in components.items() if value is not None}
    total = sum(weights[key] for key in valid)
    if not total:
        return None, []
    score = sum(value * weights[key] for key, value in valid.items()) / total
    if components.get("face_presence") == 0:
        score = min(score, 25.0)
    return round(score, 1), list(valid)


def _unavailable(message: str, elapsed: float = 0.0) -> dict:
    result = {
        "signals_available": False, "frames_sampled": 0, "analyzed_frame_count": 0,
        "face_frames": 0, "face_presence_percentage": None, "face_presence_status": "unavailable",
        "valid_eye_contact_frames": 0, "eye_contact_percentage": None, "eye_contact_status": "unavailable",
        "head_stability_score": None, "excessive_movement_count": 0, "head_stability_status": "unavailable",
        "multiple_face_frame_count": 0, "multiple_face_percentage": None, "multiple_face_warning": False,
        "multiple_face_message": "Unavailable", "average_brightness": None, "dark_frame_percentage": None,
        "overexposed_frame_percentage": None, "lighting_status": "unavailable",
        "lighting_recommendation": "Lighting could not be analysed.", "camera_framing_score": None,
        "camera_framing_status": "unavailable", "camera_framing_guidance": ["Camera framing could not be analysed."],
        "visual_presentation_score": None, "visual_presentation_status": "unavailable",
        "visual_presentation_components": [], "visual_presentation_disclaimer": DISCLAIMER,
        "processing_time_ms": round(elapsed, 1), "message": message,
    }
    result.update({key: None for key in (
        "face_detection_percentage", "forward_facing_percentage", "head_position_score",
        "looking_away_percentage", "smile_percentage", "face_visibility_percentage",
        "camera_stability_score", "lighting_quality_score", "body_language_confidence_score",
        "video_confidence_score",
    )})
    result["stability_note"] = "Not analyzed"
    return result


def analyze_video_signals(video_path: str, max_samples: int | None = None,
                          config: VisualAnalysisConfig | None = None) -> dict:
    """Sample frames sequentially so memory is bounded and codec seeking cannot hang."""
    started = time.perf_counter()
    cfg = config or VisualAnalysisConfig()
    limit = max(1, max_samples or cfg.max_samples)
    capture = cv2.VideoCapture(video_path)
    try:
        # Some Windows OpenCV builds oversubscribe CPU threads for small Haar
        # workloads, making a handful of frames take minutes.
        cv2.setNumThreads(1)
        if hasattr(cv2, "CAP_PROP_ORIENTATION_AUTO"):
            capture.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)
        if not capture.isOpened():
            return _unavailable("The uploaded video could not be decoded.")
        count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        stride = max(1, math.ceil(count / limit)) if count else 1
        face_model = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        eye_model = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
        if face_model.empty() or eye_model.empty():
            return _unavailable("OpenCV face models are unavailable.")

        sampled = one_face = multiple = eyes_valid = eyes_forward = dark = bright = 0
        centered = sized = visible = excessive = 0
        brightness: list[float] = []
        centres: list[tuple[float, float]] = []
        corrections = {key: 0 for key in ("close", "far", "left", "right", "high", "low", "edge")}
        index = 0
        while sampled < limit:
            if time.perf_counter() - started >= cfg.max_processing_seconds:
                logger.warning("Video analysis reached its %.1fs processing limit", cfg.max_processing_seconds)
                break
            ok, frame = capture.read()
            if not ok:
                break
            take = index % stride == 0
            index += 1
            if not take or frame is None or frame.size == 0:
                continue
            sampled += 1
            height, width = frame.shape[:2]
            if min(height, width) < 80:
                continue
            if width > cfg.max_analysis_width:
                scale = cfg.max_analysis_width / width
                frame = cv2.resize(frame, (cfg.max_analysis_width, max(1, round(height * scale))))
                height, width = frame.shape[:2]
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            level = float(gray.mean())
            brightness.append(level)
            dark += level < cfg.dark_brightness
            bright += level > cfg.overexposed_brightness
            faces = face_model.detectMultiScale(gray, 1.1, 5,
                minSize=(max(30, width // 12), max(30, height // 12)))
            multiple += len(faces) > 1
            if len(faces) != 1:
                continue
            one_face += 1
            x, y, fw, fh = faces[0]
            cx, cy = (x + fw / 2) / width, (y + fh / 2) / height
            area = fw * fh / float(width * height)
            centres.append((cx, cy))
            is_centered = cfg.centre_x[0] <= cx <= cfg.centre_x[1] and cfg.centre_y[0] <= cy <= cfg.centre_y[1]
            is_sized = cfg.min_face_area_ratio <= area <= cfg.max_face_area_ratio
            is_visible = x > 2 and y > 2 and x + fw < width - 2 and y + fh < height - 2
            centered += int(is_centered); sized += int(is_sized); visible += int(is_visible)
            corrections["close"] += int(area > cfg.max_face_area_ratio)
            corrections["far"] += int(area < cfg.min_face_area_ratio)
            corrections["left"] += int(cx < cfg.centre_x[0]); corrections["right"] += int(cx > cfg.centre_x[1])
            corrections["high"] += int(cy < cfg.centre_y[0]); corrections["low"] += int(cy > cfg.centre_y[1])
            corrections["edge"] += int(not is_visible)
            upper = gray[y:y + max(1, int(fh * .62)), x:x + fw]
            eyes = eye_model.detectMultiScale(upper, 1.1, 5)
            if len(eyes) >= 2:
                eyes_valid += 1
                eyes_forward += int(is_centered)

        if not sampled:
            return _unavailable("The uploaded video contains no readable frames.")
        movements = [math.dist(a, b) for a, b in zip(centres, centres[1:])]
        excessive = sum(value > cfg.excessive_movement_distance for value in movements)
        stability = None if len(movements) < 2 else round(100 * (1 - excessive / len(movements)), 1)
        face_presence = _pct(one_face, sampled)
        multi_pct = _pct(multiple, sampled)
        engagement = _pct(eyes_forward, eyes_valid) if eyes_valid >= cfg.min_eye_evidence_frames else None
        dark_pct, bright_pct = _pct(dark, len(brightness)), _pct(bright, len(brightness))
        average_brightness = round(sum(brightness) / len(brightness), 1) if brightness else None
        if dark_pct is None:
            lighting_status, lighting_score, lighting_tip = "unavailable", None, "Lighting could not be analysed."
        elif dark_pct >= cfg.lighting_warning_percentage:
            lighting_status, lighting_score, lighting_tip = "too_dark", 100 - dark_pct, "Add a soft light in front of your face."
        elif bright_pct >= cfg.lighting_warning_percentage:
            lighting_status, lighting_score, lighting_tip = "overexposed", 100 - bright_pct, "Reduce strong front or background lighting."
        else:
            lighting_status, lighting_score, lighting_tip = "acceptable", 100 - max(dark_pct, bright_pct), "Lighting is suitable for an interview."

        if one_face:
            framing = round((_pct(centered, one_face) + _pct(sized, one_face) + _pct(visible, one_face)) / 3, 1)
            threshold = max(1, math.ceil(one_face * .2))
            messages = {"close": "Move slightly farther from the camera.", "far": "Move closer to the camera.",
                "left": "Move right to centre your face.", "right": "Move left to centre your face.",
                "high": "Lower the camera or sit slightly lower.", "low": "Raise the camera or sit slightly higher.",
                "edge": "Keep your full face inside the camera frame."}
            guidance = [messages[key] for key, value in corrections.items() if value >= threshold]
            guidance = guidance or ["Camera framing is suitable for an interview."]
        else:
            framing, guidance = None, ["Position one clearly visible face in the camera frame."]
        warning = bool(multi_pct is not None and multi_pct >= cfg.multiple_face_warning_percentage)
        score, used = calculate_visual_presentation_score({
            "face_presence": face_presence, "camera_engagement": engagement, "head_stability": stability,
            "lighting": lighting_score, "camera_framing": framing,
            "multiple_face_compliance": None if multi_pct is None else 100 - multi_pct,
        })
        result = {
            "signals_available": True, "frames_sampled": sampled, "analyzed_frame_count": sampled,
            "face_frames": one_face, "face_presence_percentage": face_presence, "face_presence_status": _status(face_presence),
            "valid_eye_contact_frames": eyes_valid, "eye_contact_percentage": engagement, "eye_contact_status": _status(engagement),
            "head_stability_score": stability, "excessive_movement_count": excessive, "head_stability_status": _status(stability),
            "multiple_face_frame_count": multiple, "multiple_face_percentage": multi_pct, "multiple_face_warning": warning,
            "multiple_face_message": "Multiple people appeared repeatedly in the frame." if warning else "No significant multiple-face issue detected.",
            "average_brightness": average_brightness, "dark_frame_percentage": dark_pct,
            "overexposed_frame_percentage": bright_pct, "lighting_status": lighting_status,
            "lighting_recommendation": lighting_tip, "camera_framing_score": framing,
            "camera_framing_status": _status(framing), "camera_framing_guidance": guidance,
            "visual_presentation_score": score, "visual_presentation_status": _status(score),
            "visual_presentation_components": used, "visual_presentation_disclaimer": DISCLAIMER,
            "processing_time_ms": round((time.perf_counter() - started) * 1000, 1),
        }
        result.update({
            "face_detection_percentage": face_presence, "forward_facing_percentage": engagement,
            "head_position_score": stability, "looking_away_percentage": None if engagement is None else 100 - engagement,
            "smile_percentage": None, "face_visibility_percentage": face_presence,
            "camera_stability_score": stability, "lighting_quality_score": lighting_score,
            "body_language_confidence_score": score, "video_confidence_score": score,
            "stability_note": "Unavailable" if stability is None else "Stable" if stability >= 75 else "Needs improvement",
        })
        return result
    except Exception:  # noqa: BLE001
        logger.exception("OpenCV video analysis failed")
        return _unavailable("Visual presentation analysis is unavailable for this recording.",
                            (time.perf_counter() - started) * 1000)
    finally:
        capture.release()
