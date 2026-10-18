"""Free, no-LLM screenshot parsing via CLIP zero-shot. Owner: Person A.

A zero-cost fallback for /extract when no LLM_API_KEY is configured. We run the
uploaded screenshot through the same CLIP model that powers search and pick the
best-matching label from small candidate sets (category, type, color, fit,
material, vibe). No API spend, fully local. Coarser than a vision LLM, but good
enough to produce a real attribute vector that drives genuine vector search.

main.py prefers Person B's LLM extractor whenever a key is configured; this is
the graceful fallback so the whole pipeline runs for free.
"""
from pathlib import Path
from typing import Optional

import numpy as np

import search  # reuse the shared CLIP singleton + embedding helpers
from schemas import ExtractResponse, Item

# Candidate label sets. CLIP scores the image against each phrasing and we keep
# the best. Keep these short — every label is a CLIP text forward pass.
_CATEGORY_PROMPTS: dict[str, str] = {
    "top": "a top, t-shirt, blouse, or sweater",
    "bottom": "pants, jeans, trousers, or a skirt",
    "dress": "a dress or gown",
    "outerwear": "a jacket, coat, or blazer",
    "shoes": "shoes, boots, heels, or sneakers",
    "bag": "a handbag, tote, or purse",
    "accessory": "a hat, belt, scarf, or piece of jewelry",
}

_TYPES: dict[str, list[str]] = {
    "top": ["t-shirt", "blouse", "sweater", "knit top", "tank top", "hoodie", "corset top", "button-up shirt"],
    "bottom": ["jeans", "trousers", "mini skirt", "maxi skirt", "cargo pants", "leggings", "shorts"],
    "dress": ["mini dress", "maxi dress", "midi dress", "slip dress", "bodycon dress"],
    "outerwear": ["denim jacket", "leather jacket", "bomber jacket", "trench coat", "blazer", "puffer jacket", "cardigan"],
    "shoes": ["sneakers", "ankle boots", "heels", "loafers", "sandals"],
    "bag": ["shoulder bag", "tote bag", "mini bag", "crossbody bag", "clutch"],
    "accessory": ["baseball cap", "beanie", "belt", "scarf", "sunglasses", "necklace"],
}

_COLORS = [
    "black", "white", "cream", "grey", "brown", "tan", "beige", "navy", "blue",
    "light blue", "washed denim blue", "red", "pink", "green", "olive", "yellow", "purple",
]
_FITS = ["oversized", "fitted", "cropped", "relaxed", "slim", "flowy", "baggy"]
_MATERIALS = ["denim", "leather", "faux leather", "cotton knit", "satin", "wool", "linen", "nylon", "lace"]
_VIBES = ["streetwear", "minimalist", "y2k", "casual", "elegant", "sporty", "edgy"]


def _best(img_vec: np.ndarray, labels: list[str], template: str) -> tuple[str, float]:
    """Return the (label, cosine) that best matches the image for a prompt template."""
    best_label, best_score = labels[0], -1.0
    for label in labels:
        txt_vec = search._embed_text(template.format(label))
        score = float(img_vec @ txt_vec)
        if score > best_score:
            best_score, best_label = score, label
    return best_label, best_score


def _caption_brands(caption: Optional[str]) -> list[str]:
    """Scan optional caption text for brands we actually carry (free brand hint)."""
    if not caption:
        return []
    low = caption.lower()
    hits: list[str] = []
    for brand in {p.brand for p in search.CATALOG}:
        if brand.lower() in low and brand not in hits:
            hits.append(brand)
    return hits


def extract_items(image_path: Path, image_id: str, caption: Optional[str] = None) -> ExtractResponse:
    """CLIP zero-shot attributes for the dominant garment in the screenshot."""
    try:
        img_vec = search._embed_image(Path(image_path))
    except Exception:
        # CLIP unavailable -> reuse Person B's safe single-item fallback shape.
        return _fallback(image_id)

    # Score categories against their natural-language phrasings, not the enum word.
    best_cat, best_cat_score = "top", -1.0
    for cat, phrase in _CATEGORY_PROMPTS.items():
        s = float(img_vec @ search._embed_text(f"a photo of {phrase}"))
        if s > best_cat_score:
            best_cat_score, best_cat = s, cat
    category = best_cat

    gtype, _ = _best(img_vec, _TYPES[category], "a photo of a {}")
    color, _ = _best(img_vec, _COLORS, "a photo of a {} colored piece of clothing")
    fit, _ = _best(img_vec, _FITS, "a {} fit garment")
    material, _ = _best(img_vec, _MATERIALS, "clothing made of {}")
    vibe, _ = _best(img_vec, _VIBES, "a {} style outfit")

    # De-dupe repeated tokens (e.g. material "denim" + type "denim jacket").
    seen: set[str] = set()
    words: list[str] = []
    for token in " ".join(w for w in (color, fit, material, gtype) if w).split():
        if token.lower() not in seen:
            seen.add(token.lower())
            words.append(token)
    description = " ".join(words)
    brands = _caption_brands(caption)

    item = Item(
        id="item_1",
        category=category,
        type=gtype,
        color=color,
        fit=fit,
        material=material,
        vibe=vibe,
        brand_guess=brands[0] if brands else None,
        description=description,
    )
    return ExtractResponse(image_id=image_id, items=[item], caption_brands=brands)


def _fallback(image_id: str) -> ExtractResponse:
    return ExtractResponse(
        image_id=image_id,
        items=[
            Item(
                id="item_1",
                category="outerwear",
                type="denim jacket",
                color="washed denim blue",
                fit="oversized",
                material="denim",
                vibe="streetwear",
                brand_guess=None,
                description="oversized washed denim jacket",
            )
        ],
        caption_brands=[],
    )
