"""FastAPI routes. Run: uvicorn main:app --reload --port 8000  (from backend/)

Demo safety net: any request with ?demo=1 (or DEMO_MODE=1 in .env) is served
from data/demo_cache.json instead of calling the models.
"""
import json
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import extract
import refine
import search
from schemas import (
    ExtractResponse,
    RefineRequest,
    RefineResponse,
    SearchRequest,
    SearchResponse,
)

load_dotenv(Path(__file__).parent.parent / ".env")

DATA_DIR = Path(__file__).parent.parent / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
DEMO_CACHE_PATH = DATA_DIR / "demo_cache.json"

app = FastAPI(title="AI Stylist")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _demo(demo: int) -> bool:
    return bool(demo) or os.getenv("DEMO_MODE") == "1"


def _cached(key: str):
    cache = json.loads(DEMO_CACHE_PATH.read_text())
    if key not in cache:
        raise HTTPException(503, f"demo_cache.json has no '{key}' entry yet")
    return cache[key]


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/extract", response_model=ExtractResponse)
async def extract_route(
    image: UploadFile = File(...),
    caption: str | None = Form(None),
    demo: int = 0,
):
    if _demo(demo):
        return _cached("extract")
    image_id = f"upload_{uuid.uuid4().hex[:8]}"
    path = UPLOAD_DIR / f"{image_id}{Path(image.filename or '').suffix or '.jpg'}"
    path.write_bytes(await image.read())
    return extract.extract_items(path, image_id, caption)


@app.post("/search", response_model=SearchResponse)
def search_route(req: SearchRequest, demo: int = 0):
    if _demo(demo):
        return _cached("search").get(req.item.id) or _cached("search")["default"]
    return search.search_item(req)


@app.post("/refine", response_model=RefineResponse)
def refine_route(req: RefineRequest, demo: int = 0):
    if _demo(demo):
        return _cached("refine")
    return refine.refine(req)
