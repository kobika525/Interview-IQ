from pathlib import Path

from app.ai.speech import speech_to_text


def test_browser_webm_is_normalized_and_cleaned(monkeypatch, tmp_path):
    source = tmp_path / "browser.webm"
    source.write_bytes(b"browser-media")
    normalized = tmp_path / "normalized.wav"

    def fake_extract(path):
        assert path == str(source)
        normalized.write_bytes(b"RIFF-normalized")
        return str(normalized)

    monkeypatch.setattr("app.ai.video.audio_extractor.extract_audio_track", fake_extract)
    monkeypatch.setattr(speech_to_text.settings, "GEMINI_API_KEY", "test-key")

    class State:
        name = "ACTIVE"

    class Uploaded:
        name = "files/test"
        state = State()

    class Files:
        uploaded_path = None

        def upload(self, *, file, config):
            self.uploaded_path = file
            assert config["mime_type"] in {"audio/x-wav", "audio/wav"}
            return Uploaded()

        def delete(self, *, name):
            assert name == "files/test"

    class Response:
        text = (
            '{"transcript":"Spoken answer","detected_language":"en",'
            '"confidence_level":90,"fluency":88,'
            '"pronunciation_quality":91,"voice_clarity":92}'
        )

    class Models:
        def generate_content(self, **kwargs):
            return Response()

    class Client:
        def __init__(self):
            self.files = Files()
            self.models = Models()

    client = Client()
    monkeypatch.setattr(speech_to_text, "create_client", lambda timeout: client)

    result = speech_to_text.transcribe_audio(str(source))

    assert result["available"] is True
    assert result["transcript"] == "Spoken answer"
    assert client.files.uploaded_path == str(normalized)
    assert source.exists()
    assert not normalized.exists()
