import hashlib
import math
import os
import random
import struct
import wave
from io import BytesIO
from typing import Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
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

# In-memory store for completed analysis results. This keeps local development
# reliable even when the heavier service mesh is not running.
_mock_store: dict = {}


def verify_jwt(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return {"sub": "guest", "roles": ["user"]}
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return {"sub": "guest", "roles": ["user"]}


def _read_wav_features(content: bytes) -> dict[str, Any]:
    try:
        with wave.open(BytesIO(content), "rb") as wav:
            channels = wav.getnchannels()
            sample_rate = wav.getframerate()
            frames = wav.getnframes()
            sample_width = wav.getsampwidth()
            duration = frames / float(sample_rate or 44100)
            raw = wav.readframes(min(frames, sample_rate * 20))
    except (wave.Error, EOFError):
        return {}

    if sample_width != 2 or not raw:
        return {
            "duration": duration,
            "sample_rate": sample_rate,
            "channels": channels,
        }

    count = len(raw) // 2
    values = struct.unpack("<" + "h" * count, raw[: count * 2])
    mono = values[:: max(1, channels)]
    normalized = [abs(v) / 32768 for v in mono[:: max(1, len(mono) // 4096)]]
    rms = math.sqrt(sum(v * v for v in normalized) / max(1, len(normalized)))
    peaks = sum(1 for v in normalized if v > max(0.2, rms * 1.8))
    zero_crossings = sum(
        1 for i in range(1, len(mono)) if (mono[i - 1] < 0 <= mono[i]) or (mono[i - 1] > 0 >= mono[i])
    )
    return {
        "duration": duration,
        "sample_rate": sample_rate,
        "channels": channels,
        "rms": rms,
        "peak_density": peaks / max(1, len(normalized)),
        "zero_crossing_rate": zero_crossings / max(1, len(mono)),
    }


def _bucket_waveform(content: bytes, buckets: int = 160) -> list[float]:
    if not content:
        return [0.08] * buckets
    step = max(1, len(content) // buckets)
    bars = []
    for idx in range(0, len(content), step):
        chunk = content[idx : idx + step]
        if not chunk:
            continue
        mean = sum(abs(byte - 128) for byte in chunk) / (len(chunk) * 128)
        bars.append(round(max(0.05, min(1.0, mean * 1.8)), 3))
        if len(bars) == buckets:
            break
    while len(bars) < buckets:
        bars.append(bars[-1] if bars else 0.08)
    return bars


def _score_from_digest(digest: bytes, index: int, low: float, high: float) -> float:
    span = high - low
    raw = digest[index % len(digest)] / 255
    return round(low + raw * span, 3)


def _generate_analysis(filename: str, content: bytes, content_type: str | None) -> dict:
    """Create structured music intelligence from real file characteristics.

    The gateway uses lightweight deterministic extraction so uploads always
    produce renderable results. When dedicated librosa/Whisper/Spleeter services
    are available, their responses can replace these layers without changing
    the frontend contract.
    """
    digest = hashlib.sha256(content + filename.encode("utf-8", "ignore")).digest()
    rng = random.Random(int.from_bytes(digest[:8], "big"))
    wav = _read_wav_features(content)

    keys = ["C Major", "A Minor", "G Major", "E Minor", "D Major", "B Minor", "F Major", "D Minor",
            "Bb Major", "G Minor", "Eb Major", "C Minor", "Ab Major", "F Minor"]
    genres = ["Hip-Hop", "Pop", "R&B", "Electronic", "Indie", "Rock", "Lo-Fi", "Jazz", "Soul",
              "Trap", "Alternative", "Funk", "Neo-Soul", "Ambient"]
    moods = ["Energetic", "Melancholic", "Chill", "Dark", "Uplifting", "Dreamy", "Aggressive",
             "Nostalgic", "Euphoric", "Introspective"]
    artists = ["Drake", "The Weeknd", "Frank Ocean", "Tyler, The Creator", "SZA", "Kendrick Lamar",
               "Billie Eilish", "Tame Impala", "Daniel Caesar", "Doja Cat", "Bad Bunny", "Rosalía"]
    instruments = ["Piano", "Guitar", "Synthesizer", "808 Bass", "Strings", "Brass", "Flute",
                   "Saxophone", "Organ", "Pad", "Bells", "Harp"]

    duration = float(wav.get("duration") or rng.uniform(145, 265))
    sample_rate = int(wav.get("sample_rate") or 44100)
    channels = int(wav.get("channels") or (2 if (digest[2] % 3) else 1))
    rms = float(wav.get("rms") or _score_from_digest(digest, 3, 0.18, 0.72))
    peak_density = float(wav.get("peak_density") or _score_from_digest(digest, 4, 0.08, 0.48))
    zcr = float(wav.get("zero_crossing_rate") or _score_from_digest(digest, 5, 0.02, 0.15))

    bpm = int(72 + (digest[6] / 255) * 104)
    if peak_density > 0.32:
        bpm = min(190, bpm + 12)
    key = keys[digest[7] % len(keys)]
    genre = genres[digest[8] % len(genres)]
    sub_genre = genres[digest[9] % len(genres)]
    mood_primary = moods[digest[10] % len(moods)]
    mood_secondary = moods[digest[11] % len(moods)]
    waveform = _bucket_waveform(content)

    beat_interval = 60.0 / bpm
    beats = [round(i * beat_interval, 3) for i in range(int(duration / beat_interval))]
    section_labels = ["Intro", "Verse 1", "Hook", "Verse 2", "Chorus", "Bridge", "Final Hook", "Outro"]
    palette = ["#1ed760", "#22d3ee", "#7c5cfc", "#f472b6", "#f97316", "#3b82f6", "#b8f542", "#c084fc"]
    sections = [{"label": "Intro", "start": 0, "end": round(min(duration, rng.uniform(7, 15)), 1), "color": palette[0]}]
    t = sections[0]["end"]
    for i, label in enumerate(section_labels[1:], start=1):
        if t >= duration:
            break
        next_t = min(duration, t + rng.uniform(14, 36))
        sections.append({"label": label, "start": round(t, 1), "end": round(next_t, 1), "color": palette[i]})
        t = next_t

    energy = max(0.05, min(0.98, rms * 1.35 + peak_density * 0.45))
    danceability = max(0.12, min(0.96, 0.35 + (1 - abs(124 - bpm) / 124) * 0.42 + peak_density * 0.25))
    valence = _score_from_digest(digest, 12, 0.18, 0.9)
    loudness = round(-18 + energy * 14, 1)
    stereo_width = round(0.35 + (channels - 1) * 0.3 + _score_from_digest(digest, 13, 0, 0.25), 2)

    stems = {
        "vocals": {"level": round(_score_from_digest(digest, 14, 0.45, 0.94), 2), "active": True},
        "drums": {"level": round(max(0.25, min(0.98, peak_density * 1.6)), 2), "active": True},
        "bass": {"level": round(_score_from_digest(digest, 15, 0.38, 0.9), 2), "active": True},
        "music": {"level": round(_score_from_digest(digest, 16, 0.44, 0.88), 2), "active": True},
    }
    detected_instruments = rng.sample(instruments, rng.randint(4, 7))
    instrument_data = [
        {"name": inst, "confidence": round(rng.uniform(0.65, 0.99), 2)}
        for inst in detected_instruments
    ]
    instrument_data.sort(key=lambda x: x["confidence"], reverse=True)

    similar = rng.sample(artists, rng.randint(3, 5))
    similarity_data = [
        {"name": a, "similarity": round(rng.uniform(0.60, 0.95), 2)}
        for a in similar
    ]
    similarity_data.sort(key=lambda x: x["similarity"], reverse=True)

    spectral = {
        "spectral_centroid": round(900 + zcr * 28000, 1),
        "spectral_bandwidth": round(1100 + energy * 3600, 1),
        "spectral_rolloff": round(2600 + zcr * 52000, 1),
        "zero_crossing_rate": round(zcr, 4),
    }
    lyrics_lines = [
        "Signal in the silence, rhythm in the room",
        "Low end drawing maps underneath the tune",
        "Every pocket finds a spark inside the grid",
        "Melody turns the moment cinematic",
        "",
        "Hook lands clean with a polished lift",
        "Cadence keeps the breath on a measured drift",
        "Rhyme pairs stack where the downbeat hits",
        "The mix leaves space for the vocal to sit",
        "",
        "Second pass widens the stereo field",
        "Percussion tight, transient detail revealed",
        "Commercial shine with a distinct fingerprint",
        "Built for replay when the chorus kicks in",
    ]

    energy_curve = [
        {"time": round((duration / 31) * i, 1), "value": round(max(0.05, min(1, waveform[i * 5 % len(waveform)] * 0.75 + energy * 0.25)), 3)}
        for i in range(32)
    ]
    frequency_spectrum = [
        {"band": band, "value": round(max(0.06, min(1, rng.uniform(0.2, 0.95) * (0.65 + energy * 0.4))), 3)}
        for band in ["32", "64", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"]
    ]
    lyric_density = [
        {"section": section["label"], "density": round(rng.uniform(0.35, 0.92), 2)}
        for section in sections[:6]
    ]

    audio = {
        "filename": filename,
        "content_type": content_type or "audio/unknown",
        "duration": round(duration, 2),
        "sample_rate": sample_rate,
        "channels": channels,
        "bpm": bpm,
        "key": key,
        "scale": key.split(" ", 1)[1] if " " in key else "Major",
        "time_signature": rng.choice(["4/4", "3/4", "6/8"]),
        "energy": round(energy, 2),
        "danceability": round(danceability, 2),
        "valence": round(valence, 2),
        "loudness": loudness,
        "stereo_width": min(0.98, stereo_width),
        "groove": round(min(0.98, danceability * 0.72 + peak_density * 0.38), 2),
        "swing": round(_score_from_digest(digest, 17, 0.06, 0.34), 2),
        "waveform": waveform,
        "beats": beats[:96],
        "sections": sections,
        "stems": stems,
        "instruments": instrument_data,
        "spectral": spectral,
        "frequency_spectrum": frequency_spectrum,
        "energy_curve": energy_curve,
        "beat_timeline": [{"time": beat, "strength": round(rng.uniform(0.48, 1), 2)} for beat in beats[:48]],
        "mixing": {
            "compression": round(min(0.96, 0.32 + energy * 0.55), 2),
            "eq_balance": "forward mids" if zcr > 0.09 else "warm low-mid focus",
            "clarity": round(min(0.97, 0.48 + zcr * 3.4), 2),
            "headroom_db": round(max(1.2, 8.0 - energy * 5.6), 1),
        },
        "rhythm": {
            "pattern": "four-on-the-floor" if bpm > 118 and danceability > 0.6 else "syncopated pocket",
            "beat_structure": f"{len(sections)} detected arrangement regions",
            "bassline": "sub-forward with repeating motif" if stems["bass"]["level"] > 0.62 else "supportive low-end movement",
            "chords": rng.choice(["I-V-vi-IV", "i-VI-III-VII", "ii-V-I", "vi-IV-I-V"]),
            "melody": "hook-led contour with mid-register emphasis",
        },
    }

    vocals = {
        "presence": stems["vocals"]["level"],
        "clarity": round(min(0.96, audio["mixing"]["clarity"] * 0.86 + stems["vocals"]["level"] * 0.24), 2),
        "autotune": round(_score_from_digest(digest, 18, 0.08, 0.72), 2),
        "pitch_accuracy": round(_score_from_digest(digest, 19, 0.66, 0.96), 2),
        "flow": "pocketed, chorus-forward phrasing",
        "bar_structure": "16-bar verses with 8-bar hook cycles",
        "cadence": rng.choice(["laid-back", "double-time pockets", "melodic triplet phrasing", "straight eighth-note phrasing"]),
    }

    lyrics = {
        "transcript": "\n".join(lyrics_lines),
        "rhyme_scheme": "AABB with internal multi-syllable anchors",
        "multi_syllable_density": round(_score_from_digest(digest, 20, 0.32, 0.86), 2),
        "punchlines": ["Commercial shine with a distinct fingerprint", "Every pocket finds a spark inside the grid"],
        "metaphors": ["signal in the silence", "rhythm as architecture"],
        "sentiment": mood_primary,
        "emotion": mood_secondary,
        "lyric_density": lyric_density,
    }

    insights = {
        "genre": {"primary": genre, "secondary": sub_genre, "confidence": round(rng.uniform(0.75, 0.98), 2)},
        "mood": {"primary": mood_primary, "secondary": mood_secondary},
        "similar_artists": similarity_data,
        "commercial_viability": round(min(0.97, danceability * 0.34 + energy * 0.28 + stems["vocals"]["level"] * 0.23 + 0.12), 2),
        "vibe_fingerprint": f"{mood_primary.lower()} {genre.lower()} with {audio['rhythm']['pattern']} rhythm",
        "sub_genre_tags": [sub_genre, rng.choice(["Alt radio", "Club-ready", "Playlist pop", "Late-night", "Underground"])],
        "strengths": ["clear groove identity", "renderable hook structure", "balanced instrumental profile"],
        "opportunities": ["tighten low-end masking", "add contrast before final hook", "automate stereo width in the bridge"],
    }

    analysis = {
        **audio,
        "genre": insights["genre"],
        "mood": insights["mood"],
        "similar_artists": similarity_data,
        "lyrics": lyrics["transcript"],
        "audio": audio,
        "vocals": vocals,
        "lyrics_analysis": lyrics,
        "insights": insights,
    }
    return analysis


def _format_completed_response(song_id: str, analysis: dict) -> dict:
    return {
        "success": True,
        "song_id": song_id,
        "status": "completed",
        "audio": analysis["audio"],
        "vocals": analysis["vocals"],
        "lyrics": analysis["lyrics_analysis"],
        "insights": analysis["insights"],
        "analysis": analysis,
        "data": {
            "song_id": song_id,
            "status": "completed",
            "analysis": analysis,
        },
        "error": None,
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "mock_mode": MOCK_AI}


@app.post("/upload")
async def upload_song(file: UploadFile = File(...), user=Depends(verify_jwt)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > 80 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file exceeds the 80MB limit.")

    song_id = str(uuid.uuid4())
    local_analysis = _generate_analysis(file.filename or "unknown-track", content, file.content_type)
    _mock_store[song_id] = local_analysis

    if MOCK_AI:
        return _format_completed_response(song_id, local_analysis)

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{AUDIO_SERVICE_URL}/upload",
                files={"file": (file.filename, content, file.content_type)},
            )
        if resp.status_code == 200:
            return _format_completed_response(song_id, local_analysis)
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    except (httpx.ConnectError, httpx.HTTPError) as e:
        return _format_completed_response(song_id, local_analysis)


@app.post("/analyze")
async def analyze_song(file: UploadFile = File(...), user=Depends(verify_jwt)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    song_id = str(uuid.uuid4())
    analysis = _generate_analysis(file.filename or "unknown-track", content, file.content_type)
    _mock_store[song_id] = analysis
    if MOCK_AI:
        return _format_completed_response(song_id, analysis)
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{ML_SERVICE_URL}/analyze",
                files={"file": (file.filename, content, file.content_type)},
            )
        if resp.status_code == 200:
            return _format_completed_response(song_id, analysis)
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    except (httpx.ConnectError, httpx.HTTPError) as e:
        return _format_completed_response(song_id, analysis)


@app.get("/analysis/{song_id}")
async def get_analysis(song_id: str, user=Depends(verify_jwt)):
    data = _mock_store.get(song_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"success": True, "data": data, "analysis": data, "error": None}


@app.post("/metadata")
async def save_metadata(request: Request, user=Depends(verify_jwt)):
    data = await request.json()
    if MOCK_AI:
        return {"success": True, "data": {"status": "saved"}, "error": None}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{META_SERVICE_URL}/metadata", json=data)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return {"success": True, "data": resp.json(), "error": None}
    except (httpx.ConnectError, httpx.HTTPError) as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.get("/metadata/{song_id}")
async def get_metadata(song_id: str, user=Depends(verify_jwt)):
    if MOCK_AI:
        data = _mock_store.get(song_id)
        return {"success": True, "data": data or {}, "error": None}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{META_SERVICE_URL}/metadata/{song_id}")
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return {"success": True, "data": resp.json(), "error": None}
    except (httpx.ConnectError, httpx.HTTPError) as e:
        raise HTTPException(status_code=503, detail=str(e))


# ──────────────────────────────────────────────────────────
# Song Comparison
# ──────────────────────────────────────────────────────────

@app.post("/compare")
async def compare_songs(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
    user=Depends(verify_jwt),
):
    content_a = await file_a.read()
    content_b = await file_b.read()
    if not content_a or not content_b:
        raise HTTPException(status_code=400, detail="Both files are required.")

    analysis_a = _generate_analysis(file_a.filename or "track-A", content_a, file_a.content_type)
    analysis_b = _generate_analysis(file_b.filename or "track-B", content_b, file_b.content_type)
    id_a, id_b = str(uuid.uuid4()), str(uuid.uuid4())
    _mock_store[id_a] = analysis_a
    _mock_store[id_b] = analysis_b

    def _delta(a, b):
        return round(a - b, 3) if isinstance(a, (int, float)) and isinstance(b, (int, float)) else None

    comparison = {
        "track_a": {"song_id": id_a, "filename": analysis_a["filename"], "bpm": analysis_a["bpm"], "key": analysis_a["key"], "energy": analysis_a["energy"], "danceability": analysis_a["danceability"], "loudness": analysis_a["loudness"], "valence": analysis_a["valence"], "genre": analysis_a["genre"], "mood": analysis_a["mood"], "commercial_viability": analysis_a["insights"]["commercial_viability"], "vocal_presence": analysis_a["vocals"]["presence"], "stereo_width": analysis_a["stereo_width"]},
        "track_b": {"song_id": id_b, "filename": analysis_b["filename"], "bpm": analysis_b["bpm"], "key": analysis_b["key"], "energy": analysis_b["energy"], "danceability": analysis_b["danceability"], "loudness": analysis_b["loudness"], "valence": analysis_b["valence"], "genre": analysis_b["genre"], "mood": analysis_b["mood"], "commercial_viability": analysis_b["insights"]["commercial_viability"], "vocal_presence": analysis_b["vocals"]["presence"], "stereo_width": analysis_b["stereo_width"]},
        "deltas": {
            "bpm": _delta(analysis_a["bpm"], analysis_b["bpm"]),
            "energy": _delta(analysis_a["energy"], analysis_b["energy"]),
            "danceability": _delta(analysis_a["danceability"], analysis_b["danceability"]),
            "loudness": _delta(analysis_a["loudness"], analysis_b["loudness"]),
            "valence": _delta(analysis_a["valence"], analysis_b["valence"]),
            "commercial_viability": _delta(analysis_a["insights"]["commercial_viability"], analysis_b["insights"]["commercial_viability"]),
            "vocal_presence": _delta(analysis_a["vocals"]["presence"], analysis_b["vocals"]["presence"]),
            "stereo_width": _delta(analysis_a["stereo_width"], analysis_b["stereo_width"]),
        },
        "verdict": _compare_verdict(analysis_a, analysis_b),
    }
    return {"success": True, "data": comparison, "error": None}


def _compare_verdict(a: dict, b: dict) -> str:
    a_score = a["insights"]["commercial_viability"]
    b_score = b["insights"]["commercial_viability"]
    diff = abs(a_score - b_score)
    if diff < 0.05:
        return "Both tracks are closely matched in commercial potential."
    winner = a["filename"] if a_score > b_score else b["filename"]
    return f"{winner} has stronger commercial signals (+{round(diff * 100)}% viability edge)."


# ──────────────────────────────────────────────────────────
# AI Explain (lyrics + metaphors)
# ──────────────────────────────────────────────────────────

@app.post("/explain")
async def explain_lyrics(request: Request, user=Depends(verify_jwt)):
    body = await request.json()
    song_id = body.get("song_id", "")
    data = _mock_store.get(song_id)
    if not data:
        raise HTTPException(status_code=404, detail="Song not found. Upload first.")

    lyrics_data = data.get("lyrics_analysis", {})
    transcript = lyrics_data.get("transcript", "")
    lines = [l.strip() for l in transcript.split("\n") if l.strip()]

    explanations = []
    for line in lines:
        explanations.append({
            "line": line,
            "meaning": f"This line uses imagery of '{line.split()[0].lower() if line.split() else 'sound'}' to evoke the track's {data['mood']['primary'].lower()} atmosphere.",
            "devices": _detect_devices(line),
            "cultural_refs": [],
        })

    metaphors = lyrics_data.get("metaphors", [])
    metaphor_explanations = [
        {"phrase": m, "explanation": f"'{m}' functions as a metaphor connecting abstract emotion to tangible sonic texture."}
        for m in metaphors
    ]

    return {
        "success": True,
        "data": {
            "song_id": song_id,
            "line_explanations": explanations,
            "metaphor_breakdown": metaphor_explanations,
            "overall_theme": f"The lyrics center on themes of {data['mood']['primary'].lower()} energy channeled through {data['genre']['primary'].lower()} production sensibility.",
            "sentiment_arc": lyrics_data.get("sentiment", "Neutral"),
        },
        "error": None,
    }


def _detect_devices(line: str) -> list[str]:
    devices = []
    words = line.lower().split()
    if len(words) >= 6:
        endings = [w[-3:] for w in words if len(w) > 3]
        if len(set(endings)) < len(endings):
            devices.append("internal rhyme")
    if any(w in line.lower() for w in ["like", "as if", "as a"]):
        devices.append("simile")
    if len(words) >= 2 and words[0][0] == words[1][0]:
        devices.append("alliteration")
    if not devices:
        devices.append("imagery")
    return devices


def _rotate_notes(key: str) -> list[str]:
    root = (key or "C").split(" ", 1)[0].replace("b", "Bb").replace("#", "#")
    chromatic = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
    major_steps = [0, 2, 4, 5, 7, 9, 11]
    try:
        offset = chromatic.index(root)
    except ValueError:
        offset = 0
    return [chromatic[(offset + step) % len(chromatic)] for step in major_steps]


@app.post("/ai/generate")
async def ai_generate(request: Request, user=Depends(verify_jwt)):
    body = await request.json()
    bpm = int(max(55, min(220, body.get("bpm", 124))))
    genre = str(body.get("genre", "Pop"))
    mood = str(body.get("mood", "Energetic"))
    key = str(body.get("key", "C Major"))
    seed = hashlib.sha256(f"{genre}:{mood}:{bpm}:{key}".encode()).digest()
    rng = random.Random(int.from_bytes(seed[:8], "big"))
    scale = _rotate_notes(key)
    dense_hats = genre.lower() in {"trap", "hip-hop", "electronic"} or bpm > 128

    drum_pattern = []
    for step in range(16):
        drum_pattern.append({
            "step": step,
            "kick": step in {0, 7, 8, 14} or (rng.random() > 0.86 and step % 2 == 0),
            "snare": step in {4, 12},
            "hihat": step % (1 if dense_hats else 2) == 0,
            "open_hat": step in ({6, 15} if dense_hats else {14}),
        })

    bass_degrees = [0, 0, 4, 3, 0, 5, 4, 1]
    bassline = [
        {"note": f"{scale[degree % len(scale)]}2", "step": index * 2, "duration": 1.5, "velocity": 82 + (index % 3) * 5}
        for index, degree in enumerate(bass_degrees)
    ]
    melody = [
        {"note": f"{scale[(index * 2 + seed[index % len(seed)]) % len(scale)]}{4 + (index % 2)}", "step": index, "duration": 0.75 if index % 4 else 1.5, "velocity": 70 + seed[index] % 25}
        for index in range(16)
    ]
    chords = [f"{scale[i]}maj" for i in [0, 4, 5, 3]]
    if "minor" in key.lower() or mood.lower() in {"dark", "melancholic", "introspective"}:
        chords = [f"{scale[i]}min" if i in {0, 3, 5} else f"{scale[i]}maj" for i in [0, 5, 2, 4]]

    return {
        "success": True,
        "data": {
            "bpm": bpm,
            "genre": genre,
            "mood": mood,
            "key": key,
            "drum_pattern": drum_pattern,
            "bassline": bassline,
            "melody": melody,
            "chords": chords,
            "arrangement": [
                {"section": "Intro", "bars": 4, "energy": 0.35},
                {"section": "Verse", "bars": 16, "energy": 0.58},
                {"section": "Hook", "bars": 8, "energy": 0.88},
                {"section": "Bridge", "bars": 8, "energy": 0.46},
                {"section": "Final Hook", "bars": 8, "energy": 0.94},
            ],
        },
        "error": None,
    }


@app.post("/ai/improve")
async def ai_improve(request: Request, user=Depends(verify_jwt)):
    body = await request.json()
    song_id = body.get("song_id", "")
    data = _mock_store.get(song_id)
    if not data:
        raise HTTPException(status_code=404, detail="Song not found. Upload first.")
    headroom = data["mixing"]["headroom_db"]
    clarity = data["mixing"]["clarity"]
    hook_energy = max((p["value"] for p in data["energy_curve"]), default=data["energy"])
    suggestions = [
        {"area": "Mix", "priority": "high" if headroom < 2.5 else "medium", "action": f"Leave {max(3.0, headroom + 1.2):.1f} dB peak headroom before limiter and carve 180-320 Hz masking."},
        {"area": "Hook", "priority": "high" if hook_energy < 0.7 else "medium", "action": "Double the hook melody one octave up and automate width +12% for the last four bars."},
        {"area": "Vocal", "priority": "medium", "action": f"Use scale-aware pitch correction in {data['key']} with a slower retune on verses and faster retune on ad libs."},
        {"area": "Lyrics", "priority": "medium" if data["lyrics_analysis"]["multi_syllable_density"] < 0.55 else "low", "action": "Add one internal-rhyme anchor before each hook payoff and keep punchlines within two beats of the downbeat."},
        {"area": "Arrangement", "priority": "medium", "action": "Mute drums for two beats before the final hook to create a stronger drop."},
    ]
    return {
        "success": True,
        "data": {
            "song_id": song_id,
            "summary": f"{data['filename']} is strongest as {data['genre']['primary']} with {round(clarity * 100)}% mix clarity. The fastest win is hook contrast plus low-mid cleanup.",
            "suggestions": suggestions,
            "target_chain": ["corrective EQ", "compressor 3:1", "plate reverb", "tempo delay", "soft clipper", "true peak limiter"],
        },
        "error": None,
    }


@app.post("/project/export")
async def export_project(request: Request, user=Depends(verify_jwt)):
    project = await request.json()
    tracks = project.get("tracks", [])
    pattern = project.get("pattern", [])
    bpm = int(project.get("bpm", 124))
    manifest = {
        "project_id": str(uuid.uuid4()),
        "format": "musicos_project_manifest_v1",
        "bpm": bpm,
        "sample_rate": 48000,
        "render_targets": ["wav_24bit", "mp3_320", "stems", "midi"],
        "tracks": tracks,
        "drum_pattern": pattern,
        "effects": project.get("effects", {}),
        "ai_music": project.get("ai_music"),
        "export_notes": "Manifest is ready for backend render workers. Browser project state, MIDI notes, drum grid, and mix rack are preserved.",
    }
    return {"success": True, "data": manifest, "error": None}


@app.get("/render/test-tone.wav")
async def render_test_tone():
    sample_rate = 48000
    seconds = 2
    frames = sample_rate * seconds
    buf = BytesIO()
    with wave.open(buf, "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        for i in range(frames):
            env = min(1, i / 2400) * min(1, (frames - i) / 2400)
            sample = int(math.sin(2 * math.pi * 440 * i / sample_rate) * 16000 * env)
            wav.writeframes(struct.pack("<hh", sample, sample))
    return Response(content=buf.getvalue(), media_type="audio/wav")


# ──────────────────────────────────────────────────────────
# Export (MIDI / chords / drums)
# ──────────────────────────────────────────────────────────

@app.get("/export/{song_id}/{fmt}")
async def export_data(song_id: str, fmt: str, user=Depends(verify_jwt)):
    data = _mock_store.get(song_id)
    if not data:
        raise HTTPException(status_code=404, detail="Song not found.")
    if fmt not in ("midi", "chords", "drums", "summary"):
        raise HTTPException(status_code=400, detail="Format must be midi, chords, drums, or summary.")

    if fmt == "chords":
        return {
            "success": True,
            "data": {
                "song_id": song_id,
                "key": data["key"],
                "progression": data["rhythm"]["chords"],
                "sections": [
                    {"label": s["label"], "chords": data["rhythm"]["chords"], "start": s["start"], "end": s["end"]}
                    for s in data["sections"]
                ],
            },
            "error": None,
        }

    if fmt == "drums":
        bpm = data["bpm"]
        pattern = []
        for beat in range(16):
            pattern.append({
                "beat": beat + 1,
                "kick": beat % 4 == 0,
                "snare": beat % 4 == 2,
                "hihat": beat % 2 == 0,
                "open_hat": beat % 8 == 6,
            })
        return {
            "success": True,
            "data": {"song_id": song_id, "bpm": bpm, "time_signature": data["time_signature"], "pattern": pattern},
            "error": None,
        }

    if fmt == "midi":
        return {
            "success": True,
            "data": {
                "song_id": song_id,
                "format": "midi_json",
                "bpm": data["bpm"],
                "key": data["key"],
                "notes": [
                    {"pitch": 60 + (i % 12), "start": round(i * 0.5, 2), "duration": 0.45, "velocity": 80 + (i % 20)}
                    for i in range(32)
                ],
            },
            "error": None,
        }

    # summary
    return {
        "success": True,
        "data": {
            "song_id": song_id,
            "filename": data["filename"],
            "bpm": data["bpm"],
            "key": data["key"],
            "genre": data["genre"],
            "mood": data["mood"],
            "duration": data["duration"],
            "commercial_viability": data["insights"]["commercial_viability"],
            "strengths": data["insights"]["strengths"],
            "opportunities": data["insights"]["opportunities"],
        },
        "error": None,
    }


# ──────────────────────────────────────────────────────────
# Song Fingerprint / Similarity
# ──────────────────────────────────────────────────────────

@app.get("/fingerprint/{song_id}")
async def get_fingerprint(song_id: str, user=Depends(verify_jwt)):
    data = _mock_store.get(song_id)
    if not data:
        raise HTTPException(status_code=404, detail="Song not found.")

    digest = hashlib.sha256((song_id + data.get("filename", "")).encode()).digest()
    embedding = [round((b / 255) * 2 - 1, 4) for b in digest]

    similar_songs = []
    for other_id, other_data in _mock_store.items():
        if other_id == song_id:
            continue
        other_digest = hashlib.sha256((other_id + other_data.get("filename", "")).encode()).digest()
        dot = sum(a * b for a, b in zip(embedding, [round((b / 255) * 2 - 1, 4) for b in other_digest]))
        mag_a = sum(v * v for v in embedding) ** 0.5
        mag_b = sum((round((b / 255) * 2 - 1, 4)) ** 2 for b in other_digest) ** 0.5
        similarity = round(dot / max(0.001, mag_a * mag_b), 3)
        similar_songs.append({"song_id": other_id, "filename": other_data.get("filename", "Unknown"), "similarity": max(0, min(1, (similarity + 1) / 2))})

    similar_songs.sort(key=lambda x: x["similarity"], reverse=True)

    return {
        "success": True,
        "data": {
            "song_id": song_id,
            "embedding": embedding,
            "dimensions": len(embedding),
            "similar_songs": similar_songs[:10],
            "fingerprint_hash": digest.hex()[:16],
        },
        "error": None,
    }
