# Metadata & Storage Service

Handles file storage (S3/MinIO) and metadata storage (PostgreSQL) for DeepTrack AI.

## Endpoints
- `POST /upload` — Upload audio file to S3
- `POST /metadata` — Save song metadata (JSON)
- `GET /metadata/{song_id}` — Retrieve song metadata

## Features
- S3/MinIO file storage
- PostgreSQL metadata storage
- Async SQLAlchemy

## Dev
- Run FastAPI: `uvicorn main:app --reload --port 8004`

## Test
- `pytest test_metadata_storage.py`
