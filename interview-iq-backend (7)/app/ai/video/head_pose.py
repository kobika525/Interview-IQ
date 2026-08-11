"""Approximate head-orientation ('forward-facing') estimate using MediaPipe
Face Mesh when available. This is intentionally a coarse, low-weight signal —
per the responsible-AI constraints, it must never be treated as detecting
attention, honesty, or engagement with certainty."""

import logging

logger = logging.getLogger("app.ai.video")


def analyze_head_pose(video_path: str, sample_every_n_frames: int = 20) -> dict:
    try:
        import cv2  # type: ignore
        import mediapipe as mp  # type: ignore

        face_mesh = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1)
        capture = cv2.VideoCapture(video_path)
        sampled, forward_facing = 0, 0
        frame_index = 0

        while True:
            success, frame = capture.read()
            if not success:
                break
            if frame_index % sample_every_n_frames == 0:
                sampled += 1
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result = face_mesh.process(rgb)
                if result.multi_face_landmarks:
                    landmarks = result.multi_face_landmarks[0].landmark
                    nose_x = landmarks[1].x
                    if 0.35 < nose_x < 0.65:  # roughly centred horizontally = forward-facing estimate
                        forward_facing += 1
            frame_index += 1
        capture.release()

        if sampled == 0:
            raise RuntimeError("No frames sampled.")

        return {"available": True, "forward_facing_percentage": round(100.0 * forward_facing / sampled, 1)}
    except Exception as exc:  # noqa: BLE001
        logger.warning("Head-pose analysis unavailable, falling back: %s", exc)
        return {
            "available": False,
            "forward_facing_percentage": None,
            "message": "Head-pose estimation isn't available in this environment (install mediapipe to enable it).",
        }
