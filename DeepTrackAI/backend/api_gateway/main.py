import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
import httpx
import uuid
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../configs/.env"))

API_PREFIX = os.getenv("API_PREFIX", "")
AUDIO_SERVICE_URL = os.getenv("AUDIO_SERVICE_URL", "http://audio_processing_service:8001")
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://ml_inference_service:8002")
NLP_SERVICE_URL = os.getenv("NLP_SERVICE_URL", "http://nlp_analysis_service:8003")
META_SERVICE_URL = os.getenv("META_SERVICE_URL", "http://metadata_storage_service:8004")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecret")
MOCK_AI = os.getenv("MOCK_AI", "false").lower() == "true"

app = FastAPI(title="DeepTrack AI - API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_jwt(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        # For development/demo purposes, allow access without token
        return {"sub": "guest", "roles": ["user"]}
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        # Fallback to guest for invalid tokens too in dev
        return {"sub": "guest", "roles": ["user"]}

@app.post("/upload")
async def upload_song(file: UploadFile = File(...), user=Depends(verify_jwt)):
    if MOCK_AI:
        return {"song_id": str(uuid.uuid4()), "status": "processing", "detail": "MOCK MODE: File received and simulated analysis started."}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{AUDIO_SERVICE_URL}/upload", files={"file": (file.filename, await file.read(), file.content_type)})
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()
    except (httpx.ConnectError, httpx.HTTPError):
        raise HTTPException(status_code=503, detail="AI Analysis services (PyTorch) are still building/starting. Please wait ~5 minutes for the first-time setup to complete.")

@app.post("/analyze")
async def analyze_song(file: UploadFile = File(...), user=Depends(verify_jwt)):
    if MOCK_AI:
        return {"task_id": "mock_task_" + str(uuid.uuid4()), "status": "completed", "result": {"bpm": 120, "key": "C Major"}}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{ML_SERVICE_URL}/analyze", files={"file": (file.filename, await file.read(), file.content_type)})
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()
    except (httpx.ConnectError, httpx.HTTPError):
        raise HTTPException(status_code=503, detail="ML Inference service is still starting. Please wait.")

@app.post("/lyrics")
async def analyze_lyrics(file: UploadFile = File(...), user=Depends(verify_jwt)):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{NLP_SERVICE_URL}/lyrics", files={"file": (file.filename, await file.read(), file.content_type)})
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()
    except (httpx.ConnectError, httpx.HTTPError):
        raise HTTPException(status_code=503, detail="NLP Analysis service is still starting. Please wait.")

@app.post("/metadata")
async def save_metadata(request: Request, user=Depends(verify_jwt)):
    data = await request.json()
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{META_SERVICE_URL}/metadata", json=data)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()

@app.get("/metadata/{song_id}")
async def get_metadata(song_id: str, user=Depends(verify_jwt)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{META_SERVICE_URL}/metadata/{song_id}")
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()
