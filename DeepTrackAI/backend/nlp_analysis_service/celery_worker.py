import os
from celery import Celery
import json
from utils.nlp import transcribe_and_analyze_lyrics

celery_app = Celery(
    "nlp_tasks",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0")
)

RESULTS_DIR = "results"
os.makedirs(RESULTS_DIR, exist_ok=True)

@celery_app.task(name="nlp_tasks.process_lyrics")
def process_lyrics(file_path: str, file_id: str):
    result = transcribe_and_analyze_lyrics(file_path)
    result_path = os.path.join(RESULTS_DIR, f"{file_id}.json")
    with open(result_path, "w") as f:
        json.dump(result, f)
    return result
