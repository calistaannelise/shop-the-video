"""Download product images and precompute CLIP embeddings. Owner: Person A.

Writes data/images/<id>.jpg and data/embeddings.npy (row i == catalog[i], L2-normalised).
Re-run whenever catalog.json changes.

Usage: python scripts/build_embeddings.py
"""
import json
from io import BytesIO
from pathlib import Path

import numpy as np
import open_clip
import requests
import torch
from PIL import Image

DATA = Path(__file__).parent.parent / "data"
IMAGES = DATA / "images"


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

    vecs = []
    with torch.no_grad():
        for i, p in enumerate(catalog):
            img = preprocess(load_image(p)).unsqueeze(0)
            v = model.encode_image(img)[0]
            vecs.append((v / v.norm()).numpy())
            print(f"{i + 1}/{len(catalog)} {p['id']}")

    np.save(DATA / "embeddings.npy", np.stack(vecs).astype(np.float32))
    print("wrote data/embeddings.npy")


if __name__ == "__main__":
    main()
