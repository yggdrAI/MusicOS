from fastapi import FastAPI, UploadFile, File

app = FastAPI()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "audio_processing"}


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    return {"filename": file.filename, "status": "received"}


@app.post("/analyze")
async def analyze():
    # Return canned analysis results
    return {"bpm": 120, "stem_count": 4, "duration_seconds": 180}
