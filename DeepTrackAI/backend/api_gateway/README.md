# API Gateway

Orchestrates requests between frontend and backend microservices. Handles authentication, routing, and aggregation.

## Endpoints
- `POST /upload` — Proxy to Audio Processing Service
- `POST /analyze` — Proxy to ML Inference Service
- `POST /lyrics` — Proxy to NLP Analysis Service
- `POST /metadata` — Proxy to Metadata Service
- `GET /metadata/{song_id}` — Proxy to Metadata Service

## Features
- JWT authentication
- CORS enabled
- Service-to-service communication

## Dev
- Run FastAPI: `uvicorn main:app --reload --port 8000`
