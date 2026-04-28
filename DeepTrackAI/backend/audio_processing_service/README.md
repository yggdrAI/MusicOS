# Audio Processing Service

Handles audio file upload, validation, feature extraction, and source separation (stems) using Demucs and Librosa.

## Endpoints
- `POST /upload` — Upload audio file (mp3/wav)
- `GET /status/{task_id}` — Get processing status
- `GET /result/{task_id}` — Get result JSON

## Features
- File validation (type, size)
- Async processing (Celery + Redis)
- Source separation (Demucs)
- Feature extraction (Librosa)

## Dev
- Run FastAPI: `uvicorn main:app --reload --port 8001`
- Start worker: `celery -A celery_worker.celery_app worker --loglevel=info`

## Test
- `pytest test_audio_processing.py`
