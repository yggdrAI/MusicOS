import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from utils.db import init_db, save_metadata, get_metadata
from utils.s3 import upload_to_s3, get_s3_url
import uuid
import shutil

app = FastAPI(title="DeepTrack AI - Metadata & Storage Service")

DATABASE_URL = os.getenv("POSTGRES_URL", "postgresql+asyncpg://user:password@localhost:5432/deeptrack")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "youraccesskey")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "yoursecretkey")

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@app.on_event("startup")
async def on_startup():
    await init_db(engine)

class MetadataRequest(BaseModel):
    song_id: str
    metadata: dict

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if file.content_type not in ["audio/wav", "audio/x-wav", "audio/mpeg"]:
        raise HTTPException(status_code=400, detail="Invalid file type.")
    file_id = str(uuid.uuid4())
    file_path = f"uploads/{file_id}_{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    s3_key = f"songs/{file_id}_{file.filename}"
    upload_to_s3(file_path, s3_key)
    url = get_s3_url(s3_key)
    return {"song_id": file_id, "s3_url": url}

@app.post("/metadata")
async def save_song_metadata(request: MetadataRequest):
    async with SessionLocal() as session:
        await save_metadata(session, request.song_id, request.metadata)
    return {"status": "ok"}

@app.get("/metadata/{song_id}")
async def get_song_metadata(song_id: str):
    async with SessionLocal() as session:
        meta = await get_metadata(session, song_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Not found")
    return meta
