"""Build data/catalog.json from live Shopify feeds. Owner: Person A.

Many brands run Shopify, which exposes https://<store>/products.json?limit=250.
We pull a few pages per brand, map each product to our Category/Tier enums, pull
colors off the Shopify "Color" option, and keep a balanced spread across
categories (so the catalog isn't 200 dresses). Brands that don't serve a Shopify
feed are listed as None and must be hand-collected.

Usage: python scripts/scrape_catalog.py
"""
import json
from pathlib import Path

import requests

OUT = Path(__file__).parent.parent / "data" / "catalog.json"

PAGES_PER_BRAND = 2          # /products.json?limit=250&page=N
MAX_PER_BRAND_CATEGORY = 14  # keep the spread balanced across categories

# Shopify base URLs that actually serve /products.json (verified).
# Cider serves HTML, Reformation/Aritzia 403 -> hand-collect if needed.
BRANDS = {
    "Edikted": "https://edikted.com",
    "Princess Polly": "https://us.princesspolly.com",
    "AGOLDE": "https://agolde.com",
    # "Cider": None,         # returns HTML, not Shopify JSON
    # "Reformation": None,   # 403
    # "Aritzia": None,       # 403
}

# Map a store's product_type / tags / title to our category enum. Order matters:
# more specific categories (dress, outerwear) are checked before generic "top".
CATEGORY_KEYWORDS = {
    "outerwear": ["jacket", "coat", "blazer", "bomber", "trench", "parka", "puffer"],
    "dress": ["dress", "gown"],
    "bottom": ["pant", "jean", "denim short", "skirt", "short", "trouser", "legging"],
    "shoes": ["shoe", "boot", "sneaker", "heel", "sandal", "loafer", "flat", "mule"],
    "bag": ["bag", "tote", "purse", "clutch", "backpack"],
    "accessory": ["hat", "belt", "jewelry", "necklace", "earring", "sunglass", "scarf", "sock"],
    "top": ["top", "tee", "t-shirt", "shirt", "sweater", "cardigan", "blouse",
            "tank", "knit", "hoodie", "bodysuit", "corset", "vest", "camisole"],
}


def guess_category(text: str) -> str | None:
    text = text.lower()
    for cat, words in CATEGORY_KEYWORDS.items():
        if any(w in text for w in words):
            return cat
    return None


def guess_tier(price: float) -> str:
    """Price bands -> our three tiers (gives a realistic budget/mid/higher spread)."""
    if price < 80:
        return "budget"
    if price < 180:
        return "mid"
    return "higher"


def extract_colors(product: dict) -> list[str]:
    """Pull color names off the Shopify 'Color' option, lowercased + de-duped."""
    colors: list[str] = []
    for opt in product.get("options", []):
        if "color" in opt.get("name", "").lower() or "colour" in opt.get("name", "").lower():
            for v in opt.get("values", []):
                c = str(v).strip().lower()
                if c and c not in colors:
                    colors.append(c)
    return colors[:6]


def short_id(brand: str) -> str:
    return brand.lower().replace(" ", "")[:6]


def scrape_brand(brand: str, base: str) -> list[dict]:
    seen_handles: set[str] = set()
    per_category: dict[str, int] = {}
    out: list[dict] = []

    for page in range(1, PAGES_PER_BRAND + 1):
        url = f"{base}/products.json?limit=250&page={page}"
        resp = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        products = resp.json().get("products", [])
        if not products:
            break

        for p in products:
            handle = p.get("handle")
            if not handle or handle in seen_handles:
                continue
            if not p.get("images") or not p.get("variants"):
                continue

            tags = p.get("tags") or []
            tag_text = " ".join(tags) if isinstance(tags, list) else str(tags)
            cat = guess_category(f"{p.get('product_type', '')} {p['title']} {tag_text}")
            if not cat:
                continue
            if per_category.get(cat, 0) >= MAX_PER_BRAND_CATEGORY:
                continue

            try:
                price = float(p["variants"][0]["price"])
            except (KeyError, ValueError, TypeError):
                continue
            if price <= 0:
                continue

            seen_handles.add(handle)
            per_category[cat] = per_category.get(cat, 0) + 1
            out.append({
                "id": f"{short_id(brand)}_{p['id']}",
                "brand": brand,
                "tier": guess_tier(price),
                "category": cat,
                "title": p["title"].strip(),
                "price": price,
                "colors": extract_colors(p),
                "image_url": p["images"][0]["src"],
                "product_url": f"{base}/products/{handle}",
            })
    return out


def main():
    catalog: list[dict] = []
    for brand, base in BRANDS.items():
        try:
            items = scrape_brand(brand, base)
            by_cat: dict[str, int] = {}
            for it in items:
                by_cat[it["category"]] = by_cat.get(it["category"], 0) + 1
            print(f"{brand}: {len(items)} items {dict(sorted(by_cat.items()))}")
            catalog += items
        except Exception as e:
            print(f"{brand}: failed ({e})")

    OUT.write_text(json.dumps(catalog, indent=2))
    tiers: dict[str, int] = {}
    cats: dict[str, int] = {}
    for it in catalog:
        tiers[it["tier"]] = tiers.get(it["tier"], 0) + 1
        cats[it["category"]] = cats.get(it["category"], 0) + 1
    print(f"\nwrote {len(catalog)} products -> {OUT}")
    print(f"  tiers: {dict(sorted(tiers.items()))}")
    print(f"  categories: {dict(sorted(cats.items()))}")


if __name__ == "__main__":
    main()
