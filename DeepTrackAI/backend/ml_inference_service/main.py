import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from celery import Celery
import uuid
import shutil

from utils.ml import analyze_beat_rhythm, analyze_melody_harmony, classify_instruments, style_similarity, sample_detection

app = FastAPI(title="DeepTrack AI - ML Inference Service")

celery_app = Celery(
    "ml_tasks",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0")
)

UPLOAD_DIR = "uploads"
RESULTS_DIR = "results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

class MLProcessResponse(BaseModel):
    task_id: str
    status: str
    detail: str

@app.post("/analyze", response_model=MLProcessResponse)
def analyze(file: UploadFile = File(...)):
    if file.content_type not in ["audio/wav", "audio/x-wav", "audio/mpeg"]:
        raise HTTPException(status_code=400, detail="Invalid file type.")
    if file.size and file.size > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large.")
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    task = celery_app.send_task("ml_tasks.run_full_analysis", args=[file_path, file_id])
    return MLProcessResponse(task_id=task.id, status="processing", detail="File uploaded and ML analysis started.")

@app.get("/status/{task_id}")
def get_status(task_id: str):
    res = celery_app.AsyncResult(task_id)
    return {"task_id": task_id, "status": res.status, "result": res.result if res.successful() else None}

@app.get("/result/{task_id}")
def get_result(task_id: str):
    result_path = os.path.join(RESULTS_DIR, f"{task_id}.json")
    if not os.path.exists(result_path):
        raise HTTPException(status_code=404, detail="Result not found.")
    with open(result_path, "r") as f:
        return JSONResponse(content=f.read())
