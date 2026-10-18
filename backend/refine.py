"""Chat refinement: message -> new filters -> re-run search. Owner: Person B.

The LLM turns a free-text request ("cheaper and in black", "what goes with this?")
into structured filter changes, then we re-run Person A's search with them. Keyword
rules act as a fallback so the chat always does something sensible.
"""
import json
from pathlib import Path

import llm
import search
from schemas import Filters, RefineRequest, RefineResponse, SearchRequest

PROMPT = (Path(__file__).parent / "prompts" / "refine.txt").read_text()

_VALID_TIERS = {"budget", "mid", "higher"}
_VALID_CATEGORIES = {"top", "bottom", "dress", "outerwear", "shoes", "bag", "accessory"}

# For "what goes with this?" — search a complementary category instead.
_COMPLEMENT = {
    "top": "bottom",
    "bottom": "top",
    "dress": "outerwear",
    "outerwear": "top",
    "shoes": "bag",
    "bag": "shoes",
    "accessory": "top",
}


def _keyword_fallback(req: RefineRequest) -> tuple[Filters, str]:
    filters = req.current.model_copy(deep=True)
    msg = req.message.lower()
    if "cheap" in msg or "budget" in msg:
        filters.tiers = ["budget"]
    elif "pricier" in msg or "nicer" in msg or "expensive" in msg or "higher" in msg:
        filters.tiers = ["higher"]
    return filters, "Here are some updated picks."


def refine(req: RefineRequest) -> RefineResponse:
    item = req.item
    category = item.category

    user = (
        PROMPT
        + "\n\nITEM:\n"
        + json.dumps(item.model_dump())
        + "\n\nCURRENT FILTERS:\n"
        + json.dumps(req.current.model_dump())
        + "\n\nMESSAGE:\n"
        + req.message
    )

    try:
        data = llm.call_json(
            [
                {"role": "system", "content": "You convert a shopper's request into search filters. Output JSON only."},
                {"role": "user", "content": user},
            ],
            model=llm.TEXT_MODEL,
        )
        raw_filters = data.get("filters") or {}

        tiers = [t for t in (raw_filters.get("tiers") or []) if t in _VALID_TIERS]
        if not tiers:
            tiers = list(req.current.tiers)

        overrides = {
            k: str(v)
            for k, v in (raw_filters.get("overrides") or {}).items()
            if v and k in {"color", "fit"}
        }

        # A category override means "search a different category" (complete the look).
        new_category = (raw_filters.get("overrides") or {}).get("category")
        if new_category in _VALID_CATEGORIES:
            category = new_category

        filters = Filters(tiers=tiers, overrides=overrides)
        reply = str(data.get("reply") or "Here are some updated picks.")
    except Exception:
        filters, reply = _keyword_fallback(req)

    # Heuristic backup for complementary requests if the model didn't set a category.
    if category == item.category and any(
        phrase in req.message.lower() for phrase in ("goes with", "go with", "complete the look", "complement", "pair with")
    ):
        category = _COMPLEMENT.get(item.category, item.category)

    search_item = item if category == item.category else item.model_copy(update={"category": category})
    res = search.search_item(
        SearchRequest(
            item=search_item,
            image_id=req.image_id,
            tiers=filters.tiers,
            overrides=filters.overrides,
            k=3,
        )
    )
    return RefineResponse(filters=filters, reply=reply, results=res.results)
