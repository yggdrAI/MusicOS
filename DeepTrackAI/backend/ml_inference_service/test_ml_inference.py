import os
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_analyze_invalid_file():
    response = client.post("/analyze", files={"file": ("test.txt", b"not audio", "text/plain")})
    assert response.status_code == 400

def test_analyze_too_large(monkeypatch):
    class DummyFile:
        content_type = "audio/wav"
        size = 60 * 1024 * 1024
        filename = "big.wav"
        file = b"0" * (60 * 1024 * 1024)
    with pytest.raises(Exception):
        client.post("/analyze", files={"file": (DummyFile.filename, DummyFile.file, DummyFile.content_type)})
