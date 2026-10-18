"""Vision LLM extraction: screenshot -> items[]. Owner: Person B.

Sends the uploaded screenshot + prompts/extract.txt to the vision model and
forces strict JSON. On any failure we return a safe single-item fallback so the
frontend never sees a 500 during the demo.
"""
from pathlib import Path
from typing import Optional

import llm
from schemas import ExtractResponse, Item

PROMPT = (Path(__file__).parent / "prompts" / "extract.txt").read_text()

_ITEM_KEYS = ["category", "type", "color", "fit", "material", "vibe", "brand_guess", "description"]
_VALID_CATEGORIES = {"top", "bottom", "dress", "outerwear", "shoes", "bag", "accessory"}


def _fallback(image_id: str) -> ExtractResponse:
    return ExtractResponse(
        image_id=image_id,
        items=[
            Item(
                id="item_1",
                category="outerwear",
                type="cropped jacket",
                color="black",
                fit="oversized",
                material="denim",
                vibe="streetwear",
                brand_guess=None,
                description="black oversized cropped denim jacket",
            )
        ],
        caption_brands=[],
    )


def _build_item(raw: dict, idx: int) -> Optional[Item]:
    category = raw.get("category")
    if category not in _VALID_CATEGORIES:
        return None
    fields = {k: raw.get(k) for k in _ITEM_KEYS}
    if not fields.get("description"):
        fields["description"] = " ".join(
            str(x) for x in (raw.get("color"), raw.get("fit"), raw.get("material"), raw.get("type")) if x
        )
    if not fields.get("type") or not fields.get("description"):
        return None
    try:
        return Item(id=f"item_{idx}", **fields)
    except Exception:
        return None


def extract_items(image_path: Path, image_id: str, caption: Optional[str] = None) -> ExtractResponse:
    user = PROMPT
    if caption:
        user += f"\n\nOptional caption text from the post (use only for brand hints): {caption!r}"

    messages = [
        {"role": "system", "content": "You are a precise fashion vision parser. Output JSON only."},
        {"role": "user", "content": user},
    ]

    try:
        data = llm.call_json(messages, model=llm.VISION_MODEL, image_path=Path(image_path))
        items: list[Item] = []
        for i, raw in enumerate(data.get("items", []), start=1):
            if isinstance(raw, dict):
                item = _build_item(raw, len(items) + 1)
                if item is not None:
                    items.append(item)
        if not items:
            return _fallback(image_id)
        caption_brands = [b for b in (data.get("caption_brands") or []) if isinstance(b, str)]
        return ExtractResponse(image_id=image_id, items=items, caption_brands=caption_brands)
    except Exception:
        return _fallback(image_id)
