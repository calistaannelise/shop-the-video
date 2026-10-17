"""CLIP + cosine search over the catalog. Owner: Person A.

TODO:
- Load open_clip ViT-B-32 once at import; embed query image + item description text
- query = normalize(w * image_vec + (1 - w) * text_vec); tune w on the demo outfit
- Cosine top-10 over data/embeddings.npy, filtered by tier/category
- Hand candidates to rerank.rerank() -> top k with "why"
- Find `original` when item.brand_guess matches a catalog brand
"""
import json
from pathlib import Path

import numpy as np

import rerank
from schemas import Product, SearchRequest, SearchResponse

DATA_DIR = Path(__file__).parent.parent / "data"
CATALOG: list[Product] = [
    Product(**p) for p in json.loads((DATA_DIR / "catalog.json").read_text())
]
_EMB_PATH = DATA_DIR / "embeddings.npy"
EMBEDDINGS: np.ndarray | None = np.load(_EMB_PATH) if _EMB_PATH.exists() else None  # row i == CATALOG[i]


def search(query_vec: np.ndarray | None, tiers: list[str], category: str | None, k: int = 10) -> list[tuple[Product, float]]:
    """Return the top-k (product, score) pairs matching the filters."""
    idx = [
        i for i, p in enumerate(CATALOG)
        if p.tier in tiers and (category is None or p.category == category)
    ]
    if query_vec is None or EMBEDDINGS is None:
        return [(CATALOG[i], 0.0) for i in idx[:k]]
    scores = EMBEDDINGS[idx] @ query_vec
    order = np.argsort(-scores)[:k]
    return [(CATALOG[idx[j]], float(scores[j])) for j in order]


def search_item(req: SearchRequest) -> SearchResponse:
    query_vec = None  # TODO: build from CLIP image (req.image_id) + text (req.item.description + req.overrides)
    candidates = search(query_vec, req.tiers, req.item.category, k=10)
    results = rerank.rerank(req.item, candidates, k=req.k)
    return SearchResponse(original=None, results=results)
