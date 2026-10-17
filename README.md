# shop-the-video — AI Stylist

Screenshot an outfit → we find the original plus dupes at every price → refine by chatting → check out in one cart.
DubHacks '26, Visa "Reimagine Shopping" track. Full plan: [docs/PLAN.md](docs/PLAN.md).

## Repo layout

```
frontend/              Next.js + Tailwind                         (Person C)
  app/                 pages: / (upload), /results, /checkout
  components/          ItemCard, ProductCard, ChatPanel, CartDrawer
  lib/types.ts         data contracts (mirror of backend/schemas.py)
  lib/api.ts           API calls + mock toggle
  lib/mocks.ts         mock responses matching the contracts
  lib/store.tsx        client-side state (extraction + cart)
backend/               FastAPI
  main.py              routes + ?demo=1 fallback                 (shared)
  schemas.py           data contracts                            (shared — change with the team)
  extract.py           vision LLM extraction                     (Person B)
  search.py            CLIP + LanceDB vector search              (Person A)
  cache.py             Redis cache + in-process fallback         (Person A)
  metrics.py           Prometheus /metrics                       (Person A)
  rerank.py            LLM re-rank                               (Person B)
  refine.py            chat → filters                            (Person B)
  prompts/             prompt text files                         (Person B)
data/
  catalog.json         product catalog — currently 5 SAMPLE rows (Person A)
  lancedb/             vector table (gen. by build_embeddings.py) (Person A)
  embeddings.npy       bare-matrix backup (same script)
  images/              downloaded product images (gitignored)
  demo_cache.json      cached demo responses — SAMPLE for now   (Person A)
scripts/
  scrape_catalog.py    Shopify /products.json scraper            (Person A)
  build_embeddings.py  CLIP image embeddings                     (Person A)
ops/
  docker-compose.yml   optional Redis cache sidecar              (Person A)
```

Every stub returns contract-shaped placeholder data, so all three parts run end-to-end from minute one.
Replace the placeholders in the file you own — look for `TODO`.

## Setup

**Backend** (Python 3.11+)
```bash
cp .env.example .env            # add your LLM API key
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# http://localhost:8000/docs for interactive API docs
```

**Frontend** (Node 20+)
```bash
cd frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_USE_MOCKS=1 to work without the backend
npm install
npm run dev                         # http://localhost:3000
```

**Catalog** (Person A)
```bash
python scripts/scrape_catalog.py
python scripts/build_embeddings.py
```

## Modes

| Setting | Effect |
|---|---|
| `NEXT_PUBLIC_USE_MOCKS=1` (frontend) | UI uses `lib/mocks.ts`, never calls the backend |
| `NEXT_PUBLIC_DEMO=1` (frontend) | Every API call adds `?demo=1` → backend serves `data/demo_cache.json` |
| `DEMO_MODE=1` (backend `.env`) | Same as above, forced server-side |

## Caching & metrics (Person A)

Search is `CLIP embed → vector lookup → LLM re-rank`. `cache.py` caches the query
embedding and the full response so repeat queries skip all of it. Redis is the
backend; if it's unreachable the cache falls back to an in-process LRU, so the
backend never hard-depends on it.

```bash
docker compose -f ops/docker-compose.yml up -d   # optional Redis (set REDIS_URL in .env)
curl localhost:8000/metrics                       # Prometheus metrics
```

Key series: `stylist_catalog_products`, `stylist_search_latency_seconds` (p95),
`stylist_search_requests_total` (QPS), `stylist_cache_ops_total{cache,result}` (hit ratio).

## LLM provider

All model calls go through `backend/llm.py`. Default is **OpenAI** (`gpt-4o` for
vision, `gpt-4o-mini` for rerank/refine). Switch providers by setting
`LLM_BASE_URL`, `LLM_VISION_MODEL`, `LLM_TEXT_MODEL` (and `LLM_API_KEY`) in `.env`.

## Rules

- **Contracts** live in `backend/schemas.py` and `frontend/lib/types.ts`. Change both together and tell the team.
- Commit small and often to your own files; `main.py` and the schemas are shared.
- **Hour 5 checkpoint:** upload → results must work end-to-end on the demo screenshot.
