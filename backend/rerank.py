"""LLM re-rank: item + top-N candidates -> best k with a one-line "why". Owner: Person B.

search.py hands us the cosine top-N candidates; we ask the LLM which ones truly
match and why, keep the original cosine score, and prefer covering distinct price
tiers. On any failure we fall back to plain vector order so /search never breaks.
"""
import json
from pathlib import Path

import llm
from schemas import Item, Product, SearchResult

PROMPT = (Path(__file__).parent / "prompts" / "rerank.txt").read_text()


def _vector_fallback(item: Item, candidates: list[tuple[Product, float]], k: int) -> list[SearchResult]:
    return [
        SearchResult(product=p, score=s, why=f"Similar {item.type}")
        for p, s in candidates[:k]
    ]


def _prefer_tier_diversity(results: list[SearchResult], k: int) -> list[SearchResult]:
    diverse: list[SearchResult] = []
    leftovers: list[SearchResult] = []
    seen: set[str] = set()
    for sr in results:
        if sr.product.tier not in seen:
            seen.add(sr.product.tier)
            diverse.append(sr)
        else:
            leftovers.append(sr)
    return (diverse + leftovers)[:k]


def rerank(item: Item, candidates: list[tuple[Product, float]], k: int = 3) -> list[SearchResult]:
    if not candidates:
        return []

    by_id = {p.id: (p, s) for p, s in candidates}
    cand_view = [
        {
            "id": p.id,
            "brand": p.brand,
            "tier": p.tier,
            "category": p.category,
            "title": p.title,
            "colors": p.colors,
            "price": p.price,
        }
        for p, _ in candidates
    ]

    user = (
        PROMPT
        + f"\n\nPick up to {k} matches."
        + "\n\nTARGET ITEM:\n"
        + json.dumps(item.model_dump())
        + "\n\nCANDIDATES:\n"
        + json.dumps(cand_view)
    )

    try:
        data = llm.call_json(
            [
                {"role": "system", "content": "You are a fashion re-ranking stylist. Output JSON only."},
                {"role": "user", "content": user},
            ],
            model=llm.TEXT_MODEL,
        )
        picks = data.get("picks", []) if isinstance(data, dict) else data
        results: list[SearchResult] = []
        used: set[str] = set()
        for pick in picks or []:
            if not isinstance(pick, dict):
                continue
            pid = pick.get("id")
            if pid not in by_id or pid in used:
                continue
            used.add(pid)
            product, score = by_id[pid]
            why = pick.get("why") or f"Similar {item.type}"
            results.append(SearchResult(product=product, score=score, why=str(why)))
        if results:
            return _prefer_tier_diversity(results, k)
    except Exception:
        pass

    return _vector_fallback(item, candidates, k)
