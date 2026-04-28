import os
from celery import Celery
import json
from utils.ml import analyze_beat_rhythm, analyze_melody_harmony, classify_instruments, style_similarity, sample_detection

celery_app = Celery(
    "ml_tasks",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0")
)

RESULTS_DIR = "results"
os.makedirs(RESULTS_DIR, exist_ok=True)

@celery_app.task(name="ml_tasks.run_full_analysis")
def run_full_analysis(file_path: str, file_id: str):
    beat = analyze_beat_rhythm(file_path)
    melody = analyze_melody_harmony(file_path)
    instruments = classify_instruments(file_path)
    style = style_similarity(file_path)
    samples = sample_detection(file_path)
    result = {**beat, **melody, **instruments, **style, **samples}
    result_path = os.path.join(RESULTS_DIR, f"{file_id}.json")
    with open(result_path, "w") as f:
        json.dump(result, f)
    return result
