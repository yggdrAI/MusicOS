from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml_inference"}


@app.post("/infer")
async def infer(payload: dict = {}):
    # Return canned inference
    return {"predictions": ["instrumental", "vocal"], "confidence": [0.9, 0.1]}
