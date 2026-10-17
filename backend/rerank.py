"""LLM re-rank: item + top-10 candidates -> best k with a one-line "why". Owner: Person B.

TODO:
- Send item attributes + candidate titles/images + prompts/rerank.txt to the LLM
- Parse strict JSON [{id, why}], map ids back to products; retry once on bad JSON
- Prefer one pick per tier when possible (Budget / Mid / Higher)
"""
from pathlib import Path

from schemas import Item, Product, SearchResult

PROMPT = (Path(__file__).parent / "prompts" / "rerank.txt").read_text()


def rerank(item: Item, candidates: list[tuple[Product, float]], k: int = 3) -> list[SearchResult]:
    # Placeholder: keep vector order until the LLM call exists.
    return [
        SearchResult(product=p, score=s, why=f"Similar {item.type}")
        for p, s in candidates[:k]
    ]
