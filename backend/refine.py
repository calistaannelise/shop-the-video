"""Chat refinement: message -> new filters -> re-run search. Owner: Person B.

TODO:
- LLM converts message + current filters into new filters (tiers, color, fit, category)
  using prompts/refine.txt; returns a short friendly `reply`
- "what goes with this?" -> search a complementary category
"""
from pathlib import Path

import search
from schemas import Filters, RefineRequest, RefineResponse, SearchRequest

PROMPT = (Path(__file__).parent / "prompts" / "refine.txt").read_text()


def refine(req: RefineRequest) -> RefineResponse:
    # Placeholder: keyword rules so the chat UI has something to call.
    filters = req.current.model_copy(deep=True)
    msg = req.message.lower()
    if "cheap" in msg:
        filters.tiers = ["budget"]
    elif "pricier" in msg or "nicer" in msg:
        filters.tiers = ["higher"]

    res = search.search_item(
        SearchRequest(item=req.item, image_id=req.image_id, tiers=filters.tiers, overrides=filters.overrides)
    )
    return RefineResponse(filters=filters, reply="Here are some updated picks.", results=res.results)
