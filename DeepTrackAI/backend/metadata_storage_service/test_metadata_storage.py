import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_upload_invalid_file():
    response = client.post("/upload", files={"file": ("test.txt", b"not audio", "text/plain")})
    assert response.status_code == 400

def test_metadata_not_found():
    response = client.get("/metadata/nonexistentid")
    assert response.status_code == 404
