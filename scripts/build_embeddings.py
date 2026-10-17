"""Download product images and build the search index. Owner: Person A.

Builds two artifacts from data/catalog.json (re-run whenever the catalog changes):
  - data/lancedb/        an embedded LanceDB table `products` (vector + metadata) <- primary
  - data/embeddings.npy  bare CLIP matrix, row i == catalog[i]                   <- backup/fallback

LanceDB lets us push tier/category filters into the vector search and scales to
millions of SKUs without a server; the .npy is kept as a zero-dependency fallback.

Usage: python scripts/build_embeddings.py
"""
import json
from io import BytesIO
from pathlib import Path

import lancedb
import numpy as np
import open_clip
import requests
import torch
from PIL import Image

DATA = Path(__file__).parent.parent / "data"
IMAGES = DATA / "images"
LANCE_DIR = DATA / "lancedb"
TABLE_NAME = "products"
IMAGES.mkdir(parents=True, exist_ok=True)


def load_image(p: dict) -> Image.Image:
    path = IMAGES / f"{p['id']}.jpg"
    if not path.exists():
        r = requests.get(p["image_url"], timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        Image.open(BytesIO(r.content)).convert("RGB").save(path, "JPEG")
    return Image.open(path).convert("RGB")


def main():
    catalog = json.loads((DATA / "catalog.json").read_text())
    model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="laion2b_s34b_b79k")
    model.eval()

    rows: list[dict] = []
    vecs: list[np.ndarray] = []
    with torch.no_grad():
        for i, p in enumerate(catalog):
            img = preprocess(load_image(p)).unsqueeze(0)
            v = model.encode_image(img)[0]
            v = (v / v.norm()).numpy().astype(np.float32)  # L2-normalised -> cosine == dot
            vecs.append(v)
            rows.append({
                "vector": v.tolist(),
                "id": p["id"],
                "brand": p["brand"],
                "tier": p["tier"],
                "category": p["category"],
                "title": p["title"],
                "price": float(p["price"]),
                "colors": p.get("colors", []),
                "image_url": p["image_url"],
                "product_url": p["product_url"],
            })
            print(f"{i + 1}/{len(catalog)} {p['id']}")

    # Primary store: LanceDB table (overwrite so re-runs are idempotent).
    db = lancedb.connect(LANCE_DIR)
    db.create_table(TABLE_NAME, data=rows, mode="overwrite")
    print(f"wrote LanceDB table '{TABLE_NAME}' ({len(rows)} rows) -> {LANCE_DIR}")

    # Backup store: bare matrix, row-aligned with catalog.json.
    np.save(DATA / "embeddings.npy", np.stack(vecs))
    print("wrote data/embeddings.npy (backup)")


if __name__ == "__main__":
    main()
