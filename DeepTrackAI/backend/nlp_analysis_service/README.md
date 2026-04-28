# NLP Analysis Service

Handles lyrics transcription (speech-to-text) and advanced NLP analysis (rhyme, density, themes, sentiment).

## Endpoints
- `POST /lyrics` — Upload audio for lyrics analysis
- `GET /status/{task_id}` — Get processing status
- `GET /result/{task_id}` — Get result JSON

## Features
- Speech-to-text (Whisper)
- Rhyme scheme detection
- Syllable density
- Theme extraction
- Sentiment (TODO)
- Async processing (Celery + Redis)

## Dev
- Run FastAPI: `uvicorn main:app --reload --port 8003`
- Start worker: `celery -A celery_worker.celery_app worker --loglevel=info`

## Test
- `pytest test_nlp_analysis.py`
