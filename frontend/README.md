# spott. frontend handoff

A responsive outfit-discovery and shopping frontend for the existing Next.js application. All implementation changes are confined to `frontend/`; backend contracts, teammate code, catalog files, and embeddings were left unchanged. No Git merges, resets, commits, or pushes were performed.

## Run locally

Requires Node 20+.

```sh
cd frontend
cp .env.local.example .env.local
npm ci
npm run dev
```

Open http://localhost:3000. The example environment enables frontend mocks. Upload a JPG, PNG, or WebP under 10 MB, or use **Try the demo look**, which appears only in frontend mock mode.

```sh
npm run lint
npx tsc --noEmit
npm run build
npm start
```

The standard dev and build commands both use `.next/`. To verify a build while a dev server is running, use `SPOTT_BUILD_DIR=.next/verification npm run build`; this keeps build artifacts separate. Next.js may add this generated type directory to `tsconfig.json`. Restart Next.js after changing environment variables.

## Simplified homepage

The homepage uses one compact header, a restrained two-column hero, and a single “How it works” section. The shared container caps at 1200 px. On mobile the hero stacks naturally, the image is capped at 300 px high, and the three steps become a vertical list.

Removed the announcement bar, full-width demo banner, uppercase hero label, oversized separate upload CTA, headline underline, image overlays, scan brackets, sticker, captions, slogan strip, and repeated closing promotion. A small header badge and footer note identify demo mode.

The upload area is the initial CTA. After choosing an image, that same component shows a preview, replace/remove actions, optional caption disclosure, and the “Find similar pieces” button. Existing validation, extraction, API modes, results navigation, styling chat, outfit builder, persistent bag, and checkout behavior are preserved.

Homepage and navigation styles are isolated in `app/home.module.css` and `components/SiteChrome.module.css`. Obsolete homepage/header/footer selectors were removed from `globals.css`; results and commerce styles remain there.

## Features

- Branded homepage with local fashion photography, drag/drop and file picker, readable image validation, decoding checks, preview, replace/remove controls, optional caption, and loading/error states.
- Results show the uploaded inspiration, backend-detected clothing pieces, keyboard-accessible category tabs, attributes, original-brand confidence where supplied, budget tiers, price sorting, and recommendation loading/retry/empty states.
- Retail product cards use supplied brand, title, price, color, image, match explanation, and HTTP(S) product URL. Failed images show an accessible fallback. There are no invented live products or retailer links.
- Outfit builder selects one product per detected item, swaps alternatives, totals selections, and adds the selected look to the bag. It supports multiple detected items without new backend endpoints.
- Styling chat retains history per item while the results page is mounted, sends suggested or typed requests, tracks returned filters, and replaces recommendations. Refined results omit the earlier original-brand match so stale results do not survive a refinement.
- Global bag uses a native modal dialog for focus containment, Escape dismissal, and return focus. Items are grouped by brand, quantities are adjustable from 1–99, zero removes a line, and totals reflect quantities. Bag contents survive internal navigation and reloads via localStorage.
- Checkout is explicitly a **preview and retailer handoff**. No card fields, payment collection, order confirmation, item reservation, or automatic retailer-cart insertion is simulated. Retailer URLs open individually when supplied.
- Responsive layouts at 375, 768, and 1440 px; semantic controls, labels, visible focus, reduced-motion support, lazy catalog images, and a prioritized local hero image. Primary white button text uses a darker brand red with 4.71:1 contrast.

The current extraction, inspiration image, outfit selections, search results, and chat are intentionally memory-only. The bag is persisted. Refreshing `/results` offers a fresh upload instead of inventing or restoring an expired backend image ID. Price tiers and sorting operate over products returned by the backend; they cannot reveal products absent from the response.

## API integration and modes

The existing `lib/types.ts` contract is unchanged.

| Mode          | Environment                                     | Behavior                                                                                             |
| ------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Frontend mock | `NEXT_PUBLIC_USE_MOCKS=1`                       | Existing typed fixtures; no backend requests. A compact demo badge and sample-look link appear.      |
| Backend demo  | `NEXT_PUBLIC_USE_MOCKS=0`, `NEXT_PUBLIC_DEMO=1` | All three API calls append `?demo=1`; backend returns its cache. A compact cache-mode badge appears. |
| Live          | Both toggles `0`                                | Calls the configured real backend. Never silently substitutes mock responses.                        |

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000`.

- `POST /extract`: multipart `image`, optional `caption`; returned `image_id` and `items` drive results.
- `POST /search`: JSON `item` and `image_id`; uses backend defaults for tiers and result count.
- `POST /refine`: JSON `item`, `image_id`, accumulated `current` filters, and `message`; uses the returned filters, reply, and results.

Requests have a 60-second timeout and user-facing connection/server errors. Styling/refinement logic remains in the backend. Mock chat intentionally uses the existing fixed refinement fixture; it does not understand arbitrary prompts.

## Assets and design

The seven supplied PNGs in `spott_elements/` appeared during implementation and were all inspected. Their originals were left untouched.

| Supplied asset                             | Decision                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `dubhacks logo.png`                        | Used in navigation/footer as `public/brand/wordmark.png`, optimized by Next Image.    |
| `1083d1ed-3f02-4824-b8bc-1e880f06818d.png` | Square S icon resized to `public/brand/icon.png` for the favicon.                     |
| `25121f49-7ea9-4123-9c44-3a36b3b56922.png` | Omitted from the homepage. SVG scan icons remain in the results workspace.            |
| `42159d4c-a687-42da-9b75-b48abd4a2925.png` | Omitted from the redesigned homepage.                                                 |
| `3b02f16a-c7f0-4bd0-8f3d-5162a487c5aa.png` | Curved arrow omitted; straightforward SVG arrows provide clearer control affordances. |
| `933712e6-e82c-4f7e-97db-03462c3c8c6c.png` | Omitted, including the earlier typographic asterisks and slogan strip.                |
| `f54fb673-4c08-4ad5-ad2b-590422b9b084.png` | Dot grid omitted to preserve a quiet image-focused layout.                            |

No separate “SPOTTED IT” badge PNG was present. The earlier HTML/CSS sticker was removed. Fonts use a single system sans-serif stack (Arial/Helvetica); no proprietary font or network font dependency is required.

Hero photography is stored locally at `public/images/everyday-style.jpg`: [woman wearing blue denim jacket by Brooke Cagle](https://unsplash.com/photos/woman-wearing-blue-denim-jacket-emlKHDEydhg), listed as free to use under the [Unsplash License](https://unsplash.com/license). The 1200 px JPEG is served directly so it displays reliably at every viewport size. It is inspiration photography, not a retailer product photo. The previous `street-style.jpg` is retained as an unused legacy asset.

The four existing mock products retain their original sample names, brands, prices, and categories. Their product images are clearly labeled local SVG garment illustrations (`demo-jacket-1.svg` through `demo-jacket-4.svg`). The compact demo badge and footer note identify sample data. These illustrations are never injected into live backend responses.

## Outstanding team dependencies

- **Person A:** production product catalog, valid product photos and retailer product URLs, embeddings, category/price coverage, similarity search, and curated backend demo cache. Existing sample product links are `#`, so the frontend correctly reports retailer links unavailable.
- **Person B:** replace extraction and conversational refinement stubs with real model calls; implement reranking and meaningful color/fit/budget interpretation. Current extraction returns one fixed jacket. The UI already supports the additional detected pieces when returned.
- **Shared future contract:** the current product schema has brand but no separate merchant field, currency, SKU/size/stock, shipping, or taxes. The UI uses brand as the retailer grouping and USD for the existing dollar-denominated sample prices. These fields need team coordination for broader commerce support.
- Real payments, multi-retailer checkout, accounts, and backend session restoration are outside the current API. No frontend imitation of these services was added.

## Files

Updated:

- `app/page.tsx`, `app/results/page.tsx`, `app/checkout/page.tsx`, `app/layout.tsx`, `app/globals.css`
- `next.config.ts` supports an optional isolated verification build directory.
- `components/ItemCard.tsx`, `ProductCard.tsx`, `ChatPanel.tsx`, `CartDrawer.tsx`
- `lib/api.ts`, `lib/mocks.ts`, `lib/store.tsx`

Added:

- `components/Icon.tsx`, `ProductImage.tsx`, `SiteChrome.tsx`
- `lib/format.ts`
- `app/home.module.css`, `components/SiteChrome.module.css`
- `public/brand/wordmark.png`, `public/brand/icon.png`
- `public/images/everyday-style.jpg`, `public/images/street-style.jpg` (legacy), `public/images/demo-jacket-{1,2,3,4}.svg`
- This handoff document

## Verification

The redesign passed ESLint, TypeScript, and an optimized production build using a separate output directory. Browser QA confirmed the new upload entry, decoded JPG preview, screenshot replacement/removal, unsupported-format error, How it works anchor, extraction-to-results navigation, outfit selection, quantity totals, checkout navigation, and styling prompt/history/result updates. Homepage layouts were visually reviewed at 375, 768, and 1440 px, including successful image loading and no horizontal overflow.

Earlier full-flow verification:

- ESLint and TypeScript checks, plus optimized Next.js build.
- Browser QA in frontend mock mode: successful JPG file selection and preview, loading-to-results navigation, budget filtering, ascending price sorting, outfit selection and replacement, add-selected-look, individual add-to-bag, styling prompt/history/result update, quantity increment/decrement, removal, modal Escape dismissal, checkout messaging, empty checkout, and bag persistence after reload.
- Homepage and results measured without horizontal overflow at 375, 768, and 1440 px. Mobile checkout was visually inspected.
- Real backend/model behavior, valid retailer-link handoff, multi-item recognition, drag/drop, and corrupted/oversized-file feedback need integration/manual testing with the team’s data. Upload format and size guards are implemented, and unsupported-format feedback was verified in the redesigned UI.

## Motion refinements

| Files                                                           | Purpose                                                                                                                                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/page.tsx`, `app/home.module.css`                           | Staggered headline lines, a short upload entrance, image reveal on viewport entry, restrained image hover, and a clearer drag-over state. Upload controls remain available throughout.                                         |
| `components/HowItWorks.tsx`, `components/HowItWorks.module.css` | Observe each step independently; draw connectors, introduce matching pieces, and confirm selections in about one second. Mobile steps trigger on entry without the desktop stagger. Replay keeps keyboard focus on its button. |
| `components/ScrollReveal.tsx`, `components/ItemCard.tsx`        | One observer per product grid; brief product arrivals without scroll listeners or per-frame React updates. The same wrapper reveals the hero image.                                                                            |
| `components/SiteChrome.tsx`, `components/SiteChrome.module.css` | Animated navigation underlines, bag-count feedback, and immediate page entry transitions. The shared store and modal remain mounted.                                                                                           |
| `app/motion.css`, `app/layout.tsx`                              | Shared button press states, pointer-only image zoom, selection confirmations, outfit additions, and refined drawer/backdrop entrances. Reduced motion removes all animation delays and movement.                               |

All fallback states remain visible without animation. No dependencies, API behavior, backend code, or teammate-owned files changed in this refinement.

Verification: ESLint, TypeScript, production build, and browser review at 1440 px desktop and 390 px mobile. Browser checks confirmed progressive per-step entry, horizontal/vertical connector animations, product arrivals, upload-to-results navigation, refinement, selection feedback, individual and whole-look bag additions, checkout navigation, and Escape focus restoration. No horizontal overflow was observed. Reduced-motion rules and hover styles were inspected in code; OS motion preference and pointer hover were not emulated.
