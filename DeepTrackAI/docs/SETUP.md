# DeepTrack AI Setup Guide

## Prerequisites
- Docker & Docker Compose
- Python 3.10+
- Node.js 18+
- (Optional) NVIDIA GPU + CUDA for ML

## 1. Clone & Configure
```sh
git clone <repo-url>
cd DeepTrackAI
cp configs/.env.example configs/.env
```

## 2. Start All Services (Dev)
```sh
docker-compose -f deployment/docker-compose.dev.yml up --build
```

## 3. Access
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000

## 4. Run Tests
See `backend/tests/` and `frontend/tests/` for details.

---

For full deployment, see `deployment/README.md`.
