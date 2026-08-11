"""Face-presence detection over a video file using OpenCV's built-in Haar
cascade (bundled with opencv-python — no extra model download). Falls back
to an "unavailable" neutral result if OpenCV isn't installed."""

import logging

logger = logging.getLogger("app.ai.video")


def analyze_face_presence(video_path: str, sample_every_n_frames: int = 15) -> dict:
    try:
        import cv2  # type: ignore

        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        capture = cv2.VideoCapture(video_path)
        total_frames_sampled = 0
        frames_with_face = 0
        frame_index = 0

        while True:
            success, frame = capture.read()
            if not success:
                break
            if frame_index % sample_every_n_frames == 0:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
                total_frames_sampled += 1
                if len(faces) > 0:
                    frames_with_face += 1
            frame_index += 1
        capture.release()

        if total_frames_sampled == 0:
            raise RuntimeError("No frames could be read from the video.")

        visibility_pct = round(100.0 * frames_with_face / total_frames_sampled, 1)
        return {"available": True, "face_visibility_percentage": visibility_pct, "frames_sampled": total_frames_sampled}
    except Exception as exc:  # noqa: BLE001
        logger.warning("Video face-presence analysis unavailable, falling back: %s", exc)
        return {
            "available": False,
            "face_visibility_percentage": None,
            "message": "Visual signal analysis isn't available in this environment (install opencv-python to enable it).",
        }
