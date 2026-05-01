# DeepTrack AI Deployment Guide

## Prerequisites
- Docker & Docker Compose
- (Optional) NVIDIA GPU drivers for ML services

## 1. Environment Setup
- Copy `.env.example` files to `.env` in `configs/`, each backend service, and frontend as needed.
- Edit secrets, DB, and S3 credentials as required.

## 2. Build & Start All Services

```sh
cd deployment
# For local dev (with hot reload):
docker-compose -f docker-compose.dev.yml up --build
# For production (add your own prod compose file):
# docker-compose -f docker-compose.prod.yml up --build
```

## 3. Access
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000

## 4. Run Tests
- Backend: `pytest` in each backend service folder
- Frontend: `npm run test`

## 5. Troubleshooting
- Check logs: `docker-compose logs -f`
- Ensure all services are healthy and reachable
- For GPU: `docker info | grep -i nvidia`

---

For advanced scaling, see `k8s/` (Kubernetes manifests, not included by default).
