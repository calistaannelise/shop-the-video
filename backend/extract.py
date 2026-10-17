"""Vision LLM extraction: screenshot -> items[]. Owner: Person B.

TODO:
- Send the image + prompts/extract.txt to the vision LLM, force strict JSON
- Validate with ExtractResponse; retry once on bad JSON
- Use `caption` (optional) to help brand detection -> caption_brands
"""
from pathlib import Path

from schemas import ExtractResponse, Item

PROMPT = (Path(__file__).parent / "prompts" / "extract.txt").read_text()


def extract_items(image_path: Path, image_id: str, caption: str | None = None) -> ExtractResponse:
    # Placeholder so the frontend can integrate before the real model call exists.
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
