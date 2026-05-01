from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "nlp_analysis"}


@app.post("/analyze_text")
async def analyze_text(payload: dict = {}):
    return {"sentiment": "neutral", "entities": []}
