"""Build data/catalog.json. Owner: Person A.

Many brands run Shopify, which exposes https://<store>/products.json?limit=250.
Check each store first; hand-collect any brand that doesn't (prioritise demo-relevant items).

Usage: python scripts/scrape_catalog.py
"""
import json
from pathlib import Path

import requests

OUT = Path(__file__).parent.parent / "data" / "catalog.json"
PER_BRAND = 50

# TODO: verify which of these actually serve /products.json; set None for hand-collected brands.
BRANDS = {
    "Cider": {"tier": "budget", "shopify": None},
    "Edikted": {"tier": "mid", "shopify": "https://edikted.com"},
    "Princess Polly": {"tier": "mid", "shopify": "https://us.princesspolly.com"},
    "Reformation": {"tier": "higher", "shopify": None},
    "Aritzia": {"tier": "higher", "shopify": None},
}

# Map a store's product_type / tags to our category enum.
CATEGORY_KEYWORDS = {
    "outerwear": ["jacket", "coat", "blazer"],
    "dress": ["dress"],
    "bottom": ["pant", "jean", "skirt", "short", "trouser"],
    "shoes": ["shoe", "boot", "sneaker", "heel", "sandal"],
    "bag": ["bag", "tote", "purse"],
    "accessory": ["hat", "belt", "jewelry", "necklace", "earring", "sunglass"],
    "top": ["top", "tee", "shirt", "sweater", "cardigan", "blouse", "tank", "knit"],
}


def guess_category(text: str) -> str | None:
    text = text.lower()
    for cat, words in CATEGORY_KEYWORDS.items():
        if any(w in text for w in words):
            return cat
    return None


def scrape_shopify(brand: str, tier: str, base: str) -> list[dict]:
    resp = requests.get(f"{base}/products.json?limit=250", timeout=20, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    out = []
    for p in resp.json()["products"]:
        cat = guess_category(f"{p.get('product_type', '')} {p['title']}")
        if not cat or not p.get("images") or not p.get("variants"):
            continue
        out.append({
            "id": f"{brand.lower().replace(' ', '')[:6]}_{p['id']}",
            "brand": brand,
            "tier": tier,
            "category": cat,
            "title": p["title"],
            "price": float(p["variants"][0]["price"]),
            "colors": [],  # TODO: pull from options named "Color" if present
            "image_url": p["images"][0]["src"],
            "product_url": f"{base}/products/{p['handle']}",
        })
        if len(out) >= PER_BRAND:
            break
    return out


def main():
    catalog = []
    for brand, cfg in BRANDS.items():
        if not cfg["shopify"]:
            print(f"skip {brand}: hand-collect")
            continue
        try:
            items = scrape_shopify(brand, cfg["tier"], cfg["shopify"])
            print(f"{brand}: {len(items)}")
            catalog += items
        except Exception as e:
            print(f"{brand}: failed ({e})")
    OUT.write_text(json.dumps(catalog, indent=2))
    print(f"wrote {len(catalog)} products -> {OUT}")


if __name__ == "__main__":
    main()
