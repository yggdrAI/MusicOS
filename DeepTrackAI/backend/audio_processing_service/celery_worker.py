import os
from celery import Celery
from utils.audio import process_audio_file
import json

celery_app = Celery(
    "audio_tasks",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0")
)

RESULTS_DIR = "results"
os.makedirs(RESULTS_DIR, exist_ok=True)

@celery_app.task(name="audio_tasks.process_audio")
def process_audio(file_path: str, file_id: str):
    result = process_audio_file(file_path, file_id)
    result_path = os.path.join(RESULTS_DIR, f"{file_id}.json")
    with open(result_path, "w") as f:
        json.dump(result, f)
    return result
