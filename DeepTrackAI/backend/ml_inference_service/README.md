# ML Inference Service

Handles deep ML analysis for beat/rhythm, melody/harmony, instrument classification, style similarity, and sample detection.

## Endpoints
- `POST /analyze` — Upload audio for ML analysis
- `GET /status/{task_id}` — Get processing status
- `GET /result/{task_id}` — Get result JSON

## Features
- Beat & rhythm detection
- Melody & harmony extraction
- Instrument classification
- Style & artist similarity
- Sample detection (experimental)
- Async processing (Celery + Redis)

## Dev
- Run FastAPI: `uvicorn main:app --reload --port 8002`
- Start worker: `celery -A celery_worker.celery_app worker --loglevel=info`

## Test
- `pytest test_ml_inference.py`
