# AI Stylist — MVP Plan (DubHacks '26, Visa "Reimagine Shopping" Track)

**Team:** 3 people · **Build time:** 8 hours · **Goal:** a reliable, rehearsed end-to-end demo

---

## 1. The Pitch in One Line

See an outfit on TikTok, screenshot it, and our AI stylist finds the original plus dupes at every price point — then lets you refine by just talking to it, and checks you out in one cart.

## 2. Track Fit

| Track asks for | How we deliver it |
|---|---|
| Generative AI | Vision model extracts clothing attributes; LLM re-ranks and explains matches |
| Conversing & collaborating with AI | Chat refinement: "cheaper", "in black", "more oversized" |
| Personalized & intuitive | Price-tier choice + explanations; style profile pitched as next step |
| Commerce | Multi-brand cart → checkout moment (Visa tie-in) |

---

## 3. MVP Scope

### In scope (must ship)
1. Upload 1+ screenshots of an outfit
2. AI detects each clothing item → structured attributes (type, color, fit, material, vibe, brand if visible)
3. Show **original** (if brand detected) + **3 dupes across price tiers**
4. Chat refinement that re-runs the search
5. Cart across brands → mocked checkout confirmation

### Out of scope (pitch as "next steps")
- TikTok/Instagram link ingestion (yt-dlp + ffmpeg)
- Share-sheet button (iOS Shortcut / native extension)
- Persistent style profile from saves
- Real payments, user accounts, live catalog sync

### Price tiers
| Tier | Brands |
|---|---|
| Budget | Cider |
| Mid | Edikted, Princess Polly |
| Higher | Reformation, Aritzia |

---

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (or Vite + React) + Tailwind | Fast to build, mobile-friendly |
| Backend | Python FastAPI | Easy ML integration |
| Vision + LLM | Any vision-capable LLM API | Extraction, re-rank, refinement |
| Embeddings | `open_clip` (ViT-B-32) | Image + text in same space |
| Search | NumPy cosine similarity | ~250 items, no DB needed |
| Catalog | `catalog.json` + `embeddings.npy` | Zero infra |
| Cart | Client-side state | No backend needed |

---

## 5. Architecture

```
[Screenshot upload]
       │
       ▼
POST /extract ──► Vision LLM ──► items[] (attributes + brand guess)
       │
       ▼
POST /search (per item)
   query = normalize(CLIP_image(screenshot) + CLIP_text("black oversized cropped cotton jacket"))
   → cosine top-10 over catalog → filter by tier/category
   → LLM re-rank → top 3 + "why it matches"
       │
       ▼
[Results: original + dupes by tier] ──► [Chat] ──► POST /refine ──► new filters ──► /search
       │
       ▼
[Cart] ──► [Mock checkout]
```

**Trick for multi-item screenshots:** combining the image embedding with a CLIP *text* embedding of each item's attributes steers the search toward that specific item, so we don't need bounding-box cropping.

---

## 6. Data Contracts (agree on these in Hour 0)

> Implemented in `backend/schemas.py` and `frontend/lib/types.ts`. Two small additions vs. the original draft:
> `/extract` returns `image_id` (pass it to `/search` and `/refine`), and `/search` accepts optional `overrides` (set by `/refine`).

### Catalog product (`catalog.json`)
```json
{
  "id": "pp_0142",
  "brand": "Princess Polly",
  "tier": "mid",
  "category": "top",
  "title": "Harlow Cropped Knit Cardigan",
  "price": 58.00,
  "colors": ["cream"],
  "image_url": "https://...",
  "product_url": "https://..."
}
```
`category` ∈ `top | bottom | dress | outerwear | shoes | bag | accessory`
`tier` ∈ `budget | mid | higher`

### `POST /extract`
Request: `multipart/form-data` with `image` (+ optional `caption`)
Response:
```json
{
  "image_id": "upload_abc",
  "items": [
    {
      "id": "item_1",
      "category": "outerwear",
      "type": "cropped jacket",
      "color": "black",
      "fit": "oversized",
      "material": "denim",
      "vibe": "streetwear",
      "brand_guess": null,
      "description": "black oversized cropped denim jacket"
    }
  ],
  "caption_brands": []
}
```

### `POST /search`
Request:
```json
{ "item": { ... }, "image_id": "upload_abc", "tiers": ["budget","mid","higher"], "k": 3, "overrides": {} }
```
Response:
```json
{
  "original": { "product": { ... }, "confidence": "high" } ,
  "results": [
    { "product": { ... }, "score": 0.82, "why": "Same cropped boxy cut and washed black denim" }
  ]
}
```
`original` is `null` when no brand is detected.

### `POST /refine`
Request:
```json
{ "item": { ... }, "image_id": "upload_abc", "current": { "tiers": ["mid"], "overrides": {} }, "message": "cheaper and in black" }
```
Response:
```json
{
  "filters": { "tiers": ["budget"], "overrides": { "color": "black" } },
  "reply": "Here are budget picks in black.",
  "results": [ ... ]
}
```

---

## 7. Work Split

### 👤 Person A — Catalog + Search
**Owns:** `catalog.json`, `embeddings.npy`, `/search` core logic, demo backup

**Hours 1–4**
- [ ] Collect ~50 products per brand (~250 total) — check for Shopify `/products.json` endpoints first; hand-collect if needed
- [ ] Normalize into the catalog schema (tier, category, price)
- [ ] Download product images locally; precompute CLIP image embeddings → `embeddings.npy`
- [ ] Write `search(query_vec, tiers, category, k=10)` with cosine similarity + filters
- [ ] **Verify the demo outfit's items have strong matches in every tier** — add products if not

**Hours 4–5**
- [ ] Integrate with Person B's extraction output; tune image/text embedding weighting

**Hours 5–6.5**
- [ ] Cache full demo responses to `demo_cache.json` + add a `?demo=1` fallback flag
- [ ] Build pitch slides (problem, demo, Visa angle, roadmap)

---

### 👤 Person B — AI (Extraction, Re-rank, Refinement)
**Owns:** `/extract`, LLM re-rank inside `/search`, `/refine`, all prompts

**Hours 1–4**
- [ ] `/extract`: send screenshot to vision LLM, force strict JSON matching the contract
- [ ] Prompt handles multiple items per image; returns a `description` string per item
- [ ] Brand detection: ask model for visible logos/text; also accept optional caption text
- [ ] Re-rank: given item + top-10 candidates, return best 3 with a one-line `why`
- [ ] Test on 5+ varied screenshots; fix JSON parsing failures (retry once on bad JSON)

**Hours 4–5**
- [ ] Wire extract → search → re-rank end-to-end with Person A

**Hours 5–6.5**
- [ ] `/refine`: LLM converts message → filter changes (tier, color, fit, category), returns friendly `reply`
- [ ] Support "what goes with this?" → search a complementary category
- [ ] Test the exact demo phrases until they work every time

---

### 👤 Person C — Frontend + Commerce Flow
**Owns:** all UI, cart, checkout, demo-day visual polish

**Hours 1–4** (use mocked JSON from the contracts until backend is ready)
- [ ] Upload screen (drag/drop + mobile camera roll)
- [ ] Loading state ("Finding your look…")
- [ ] Detected items view: one card per item with attribute chips
- [ ] Results view per item: **Original** badge + dupe cards labeled Budget / Mid / Higher, with price, brand, image, "why it matches"
- [ ] Add-to-cart buttons; cart drawer with items grouped by brand + total

**Hours 4–5**
- [ ] Swap mocks for real API calls; handle errors gracefully

**Hours 5–6.5**
- [ ] Chat panel under results → calls `/refine`, updates results in place
- [ ] Mock checkout: card form (pre-filled test card) → "Order placed across 3 stores" confirmation
- [ ] Mobile layout pass — judges may view on phones

---

## 8. Timeline

| Time | Person A | Person B | Person C |
|---|---|---|---|
| **0:00–1:00** | *All: agree on contracts, scaffold repo, choose demo screenshots* |||
| **1:00–4:00** | Catalog + embeddings + search | Extraction + re-rank prompts | UI with mocked data |
| **4:00–5:00** | *All: integrate end-to-end* — **Checkpoint 1** |||
| **5:00–6:30** | Demo cache + slides | `/refine` chat logic | Chat UI + checkout |
| **6:30–8:00** | *All: feature freeze, bug fixes on demo path, rehearse ×2* |||

### Checkpoints
- **Hour 1:** Contracts written; repo runs locally for everyone
- **Hour 4:** Each part works alone (catalog searchable, extraction returns JSON, UI renders mocks)
- **Hour 5:** Upload → results works end-to-end on the demo screenshot. **If not, all three stop and fix this.**
- **Hour 6.5:** Feature freeze

---

## 9. Demo Script (~2 minutes)

1. **Hook (15s):** "You see a fit on TikTok. You don't know where it's from — and if you do, it's $200."
2. **Upload (15s):** Drop in the screenshot.
3. **Detection (15s):** Show the AI breaking the outfit into items with attributes.
4. **Results (30s):** Original identified + dupes at Budget / Mid / Higher with reasons.
5. **Conversation (20s):** Type "make the jacket cheaper and in black" → results update.
6. **Checkout (15s):** Add items from 3 brands → one cart → order placed.
7. **Close (10s):** Visa angle — one checkout across many merchants; roadmap: TikTok share button, style profile that learns your taste.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Dupe matches look bad | Person A pre-checks demo items; text+image query; LLM re-rank filters junk |
| LLM returns invalid JSON | Strict schema in prompt, retry once, fallback to cached result |
| API slow/down during judging | `demo_cache.json` + `?demo=1` flag |
| Scraping takes too long | Cap at ~50/brand; hand-collect the demo-relevant items first |
| Integration breaks late | Contracts fixed in Hour 0; mocks match contracts exactly |

## 11. Cut Order (if behind at Hour 5)

1. Cut "what goes with this?"
2. Replace chat with **Cheaper / Pricier** toggle buttons
3. Cut brand detection (dupes only)

**Never cut:** upload → dupes across tiers → cart → checkout.

---

## 12. Roadmap (for the pitch)
- Paste a TikTok/Instagram link or share directly from the app's share sheet
- Style profile that learns from saves and personalizes ranking
- Live partner catalogs + real agentic checkout
- "Complete the look" outfit builder
