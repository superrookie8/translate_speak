import unittest
from unittest.mock import patch, MagicMock
from app import (
    app,
    translate_and_phoneticize,
    translate_to_korean_and_phoneticize,
    audio_tts,
)


class TestApp(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    @patch("app.client.chat.completions.create")
    def test_translate_and_phoneticize(self, mock_create):
        # Mock the OpenAI API responses
        mock_create.side_effect = [
            MagicMock(choices=[MagicMock(message=MagicMock(content="Hello"))]),
            MagicMock(choices=[MagicMock(message=MagicMock(content="'헬로'"))]),
        ]

        segments, phonetic_texts = translate_and_phoneticize("안녕")
        self.assertEqual(segments, ["Hello"])
        self.assertEqual(phonetic_texts, ["'헬로'"])

    @patch("app.client.chat.completions.create")
    def test_translate_to_korean_and_phoneticize(self, mock_create):
        # Mock the OpenAI API responses
        mock_create.side_effect = [
            MagicMock(choices=[MagicMock(message=MagicMock(content="안녕"))]),
            MagicMock(choices=[MagicMock(message=MagicMock(content="'헬로'"))]),
        ]

        translation, segments, phonetic_texts = translate_to_korean_and_phoneticize(
            "Hello"
        )
        self.assertEqual(translation, "안녕")
        self.assertEqual(segments, ["Hello"])
        self.assertEqual(phonetic_texts, ["헬로"])

    @patch("app.client.audio.speech.create")
    def test_audio_tts(self, mock_create):
        mock_create.return_value = MagicMock(content=b"audio_data")

        result = audio_tts("Hello")
        self.assertIsInstance(result, str)  # Should return a base64 encoded string

    def test_index_route(self):
        response = self.app.get("/")
        self.assertEqual(response.status_code, 200)

    def test_result_demo_route(self):
        response = self.app.get("/result_demo")
        self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()
