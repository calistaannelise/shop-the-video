"""CLIP + LanceDB vector search over the catalog. Owner: Person A.

Retrieval store is an embedded LanceDB table (built by scripts/build_embeddings.py):
tier/category filters are pushed *into* the ANN query (prefilter) instead of being
applied in Python after a full matrix multiply. This scales to millions of SKUs and
needs no server. If the table isn't built yet we fall back to embeddings.npy, then to
an unscored metadata listing, so the backend always boots.

Query vector = normalize(w * CLIP_image(upload) + (1 - w) * CLIP_text(description)).
When no upload is available we use the text embedding alone.
"""
import hashlib
import json
from pathlib import Path

import numpy as np

import metrics
import rerank
from cache import cache
from schemas import Item, Original, Product, SearchRequest, SearchResponse


def _hash(*parts: str) -> str:
    return hashlib.sha1("|".join(parts).encode()).hexdigest()

DATA_DIR = Path(__file__).parent.parent / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
LANCE_DIR = DATA_DIR / "lancedb"
TABLE_NAME = "products"
IMAGE_WEIGHT = 0.6  # fusion weight on the uploaded screenshot vs. the text attributes

CATALOG: list[Product] = [
    Product(**p) for p in json.loads((DATA_DIR / "catalog.json").read_text())
]

# --- backup store: bare matrix, row i == CATALOG[i] ---
_EMB_PATH = DATA_DIR / "embeddings.npy"
EMBEDDINGS: np.ndarray | None = np.load(_EMB_PATH) if _EMB_PATH.exists() else None

# --- lazily-initialised singletons (kept out of import so ?demo=1 never pays for them) ---
_TABLE = None          # LanceDB table handle
_CLIP = None           # (model, preprocess, tokenizer)


def _table():
    """Open the LanceDB table once; return None if it hasn't been built yet."""
    global _TABLE
    if _TABLE is None:
        try:
            import lancedb

            db = lancedb.connect(LANCE_DIR)
            _TABLE = db.open_table(TABLE_NAME)
        except Exception:
            _TABLE = False  # sentinel: tried and unavailable
    return _TABLE or None


def _clip():
    """Load CLIP once for query-side embedding (model is ~150MB, so lazy)."""
    global _CLIP
    if _CLIP is None:
        import open_clip

        model, _, preprocess = open_clip.create_model_and_transforms(
            "ViT-B-32", pretrained="laion2b_s34b_b79k"
        )
        model.eval()
        tokenizer = open_clip.get_tokenizer("ViT-B-32")
        _CLIP = (model, preprocess, tokenizer)
    return _CLIP


def _normalize(v: np.ndarray) -> np.ndarray:
    n = np.linalg.norm(v)
    return (v / n).astype(np.float32) if n else v.astype(np.float32)


def _embed_text(text: str) -> np.ndarray:
    import torch

    model, _, tokenizer = _clip()
    with torch.no_grad():
        v = model.encode_text(tokenizer([text]))[0]
    return _normalize(v.numpy())


def _embed_image(path: Path) -> np.ndarray:
    import torch
    from PIL import Image

    model, preprocess, _ = _clip()
    img = preprocess(Image.open(path).convert("RGB")).unsqueeze(0)
    with torch.no_grad():
        v = model.encode_image(img)[0]
    return _normalize(v.numpy())


def _find_upload(image_id: str | None) -> Path | None:
    if not image_id:
        return None
    hits = list(UPLOAD_DIR.glob(f"{image_id}.*")) if UPLOAD_DIR.exists() else []
    return hits[0] if hits else None


def _compute_query_vec(text: str, image_id: str | None) -> np.ndarray | None:
    try:
        text_vec = _embed_text(text)
    except Exception:
        return None  # CLIP unavailable -> caller falls back to unscored listing

    upload = _find_upload(image_id)
    if upload is not None:
        try:
            img_vec = _embed_image(upload)
            return _normalize(IMAGE_WEIGHT * img_vec + (1 - IMAGE_WEIGHT) * text_vec)
        except Exception:
            pass  # fall through to text-only
    return text_vec


def embed_query(req: SearchRequest) -> np.ndarray | None:
    """Build the fused CLIP query vector for a search request.

    Folds any /refine overrides (e.g. {"color": "black"}) into the text so the
    query steers toward them without a hard filter that could return nothing.
    Cached by (text, image_id) so repeat queries skip the CLIP forward pass.
    """
    text = req.item.description
    if req.overrides:
        text = f"{text} {' '.join(str(v) for v in req.overrides.values())}"

    key = "emb:" + _hash(text, req.image_id or "")
    hit = cache.get(key)
    if hit is not None:
        metrics.record_cache("embed", True)
        return np.frombuffer(hit, dtype=np.float32).copy()
    metrics.record_cache("embed", False)

    vec = _compute_query_vec(text, req.image_id)
    if vec is not None:
        cache.set(key, vec.astype(np.float32).tobytes())
    return vec


def _where(tiers: list[str], category: str | None) -> str | None:
    clauses = []
    if tiers:
        quoted = ", ".join(f"'{t}'" for t in tiers)
        clauses.append(f"tier IN ({quoted})")
    if category:
        clauses.append(f"category = '{category}'")
    return " AND ".join(clauses) or None


def _row_to_product(r: dict) -> Product:
    return Product(
        id=r["id"], brand=r["brand"], tier=r["tier"], category=r["category"],
        title=r["title"], price=r["price"], colors=list(r.get("colors") or []),
        image_url=r["image_url"], product_url=r["product_url"],
    )


def search(
    query_vec: np.ndarray | None, tiers: list[str], category: str | None, k: int = 10
) -> list[tuple[Product, float]]:
    """Return the top-k (product, cosine score) pairs matching the filters."""
    tbl = _table()

    # Primary path: LanceDB ANN with metadata prefilter.
    if tbl is not None and query_vec is not None:
        where = _where(tiers, category)
        q = tbl.search(query_vec).metric("cosine")
        if where:
            q = q.where(where, prefilter=True)
        rows = q.limit(k).to_list()
        # cosine distance -> similarity (vectors are L2-normalised)
        return [(_row_to_product(r), 1.0 - float(r["_distance"])) for r in rows]

    # Fallback path: bare matrix, then unscored metadata listing.
    idx = [
        i for i, p in enumerate(CATALOG)
        if p.tier in tiers and (category is None or p.category == category)
    ]
    if query_vec is None or EMBEDDINGS is None:
        return [(CATALOG[i], 0.0) for i in idx[:k]]
    scores = EMBEDDINGS[idx] @ query_vec
    order = np.argsort(-scores)[:k]
    return [(CATALOG[idx[j]], float(scores[j])) for j in order]


def _find_original(item: Item) -> Original | None:
    """If the vision model guessed a brand we actually carry, surface that product."""
    if not item.brand_guess:
        return None
    guess = item.brand_guess.strip().lower()
    for p in CATALOG:
        if p.brand.lower() == guess and p.category == item.category:
            return Original(product=p, confidence="medium")
    return None


def search_item(req: SearchRequest) -> SearchResponse:
    metrics.SEARCH_REQUESTS.inc()
    with metrics.SEARCH_LATENCY.time():
        key = "search:" + _hash(
            req.item.description,
            req.item.category or "",
            ",".join(sorted(req.tiers)),
            json.dumps(req.overrides, sort_keys=True),
            req.image_id or "",
            str(req.k),
        )
        hit = cache.get(key)
        if hit is not None:
            metrics.record_cache("search", True)
            return SearchResponse.model_validate_json(hit)
        metrics.record_cache("search", False)

        query_vec = embed_query(req)
        candidates = search(query_vec, req.tiers, req.item.category, k=10)
        results = rerank.rerank(req.item, candidates, k=req.k)
        resp = SearchResponse(original=_find_original(req.item), results=results)
        cache.set(key, resp.model_dump_json().encode())
        return resp
