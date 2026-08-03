import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app


class AppTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health_endpoint(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertIn("model_loaded", payload)

    def test_invalid_deck_returns_structured_error(self) -> None:
        response = self.client.post("/evaluate-deck", json={"cards": ["Arrows"]})
        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertIn("error", payload)
        self.assertEqual(payload["error"]["code"], "INVALID_REQUEST")
        self.assertIn("Exactly 8 cards", payload["error"]["message"])


if __name__ == "__main__":
    unittest.main()
