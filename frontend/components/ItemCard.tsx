"use client";
import { useEffect, useMemo, useState } from "react";
import { search } from "@/lib/api";
import type { Item, SearchResponse, SearchResult, Tier } from "@/lib/types";
import ChatPanel from "./ChatPanel";
import ProductCard from "./ProductCard";
import Icon from "./Icon";
import ScrollReveal from "./ScrollReveal";
export default function ItemCard({
  item,
  imageId,
  active,
}: {
  item: Item;
  imageId: string;
  active: boolean;
}) {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [tier, setTier] = useState<Tier | "all">("all");
  const [sort, setSort] = useState("match");
  const [refined, setRefined] = useState(false);
  useEffect(() => {
    let ignore = false;
    search({ item, image_id: imageId })
      .then((res) => {
        if (!ignore) setData(res);
      })
      .catch(() => {
        if (!ignore)
          setError("We couldn’t load your matches. Please try again.");
      });
    return () => {
      ignore = true;
    };
  }, [item, imageId, attempt]);
  const products = useMemo(() => {
    const all = data
      ? [
          ...(!refined && data.original
            ? [
                {
                  product: data.original.product,
                  score: 1,
                  why: `Brand match · ${data.original.confidence} confidence`,
                  original: true,
                },
              ]
            : []),
          ...data.results.map((r) => ({ ...r, original: false })),
        ]
      : [];
    const unique = all
      .filter(
        (r, index) =>
          all.findIndex((p) => p.product.id === r.product.id) === index,
      )
      .filter((r) => tier === "all" || r.product.tier === tier);
    return unique.sort((a, b) =>
      sort === "low"
        ? a.product.price - b.product.price
        : sort === "high"
          ? b.product.price - a.product.price
          : b.score - a.score,
    );
  }, [data, tier, sort, refined]);
  const updateResults = (results: SearchResult[]) => {
    setData((d) => ({ original: d?.original ?? null, results }));
    setRefined(true);
    setTier("all");
  };
  return (
    <div
      hidden={!active}
      id={`panel-${item.id}`}
      role="tabpanel"
      aria-labelledby={`tab-${item.id}`}
      className="item-workspace"
    >
      <div className="matches-main">
        <div className="matches-heading">
          <div>
            <p className="eyebrow">
              {refined
                ? "A FRESH TAKE ON YOUR LOOK"
                : "SIMILAR STYLE. ALL YOUR OPTIONS."}
            </p>
            <h2>
              Your {item.type} edit<span>.</span>
            </h2>
          </div>
          <span className="result-count" aria-live="polite">
            {data
              ? `${products.length} ${products.length === 1 ? "find" : "finds"}`
              : "Searching…"}
          </span>
        </div>
        <div className="results-toolbar">
          <div
            className="tier-tabs"
            role="group"
            aria-label="Filter by price tier"
          >
            {(
              [
                ["all", "All prices"],
                ["budget", "Budget"],
                ["mid", "Mid-range"],
                ["higher", "Higher-end"],
              ] as const
            ).map(([value, title]) => (
              <button
                key={value}
                aria-pressed={tier === value}
                className={tier === value ? "active" : ""}
                onClick={() => setTier(value)}
              >
                {title}
              </button>
            ))}
          </div>
          <label className="sort-label">
            <span className="sr-only">Sort products</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="match">Best match</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>
        <div className="item-attributes">
          {[item.color, item.fit, item.material, item.vibe]
            .filter(Boolean)
            .map((attribute, i) => (
              <span key={`${attribute}-${i}`}>{attribute}</span>
            ))}
        </div>
        {error ? (
          <div className="state-card" role="alert">
            <Icon name="refresh" size={28} />
            <h3>Your matches are taking a moment.</h3>
            <p>{error}</p>
            <button
              className="button button-dark"
              onClick={() => {
                setError(null);
                setData(null);
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </button>
          </div>
        ) : !data ? (
          <div
            className="product-grid"
            aria-label="Loading matching products"
            aria-busy="true"
          >
            {[1, 2, 3].map((n) => (
              <div key={n} className="product-skeleton">
                <div />
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : products.length ? (
          <ScrollReveal className="product-grid">
            {products.map((result) => (
              <ProductCard
                key={result.product.id}
                product={result.product}
                why={result.why}
                isOriginal={result.original}
                itemId={item.id}
              />
            ))}
          </ScrollReveal>
        ) : (
          <div className="state-card">
            <Icon name="scan" size={30} />
            <h3>No finds this time.</h3>
            <p>
              {tier === "all"
                ? "Try asking the stylist for another color or a more relaxed fit."
                : "Try another price tier to explore more options."}
            </p>
            {tier !== "all" && (
              <button className="text-link" onClick={() => setTier("all")}>
                Show all prices <Icon name="arrow" />
              </button>
            )}
          </div>
        )}
        <p className="results-note">
          <Icon name="scan" size={15} /> Similar pieces, picked around your
          inspiration. Prices and availability may change.
        </p>
      </div>
      <ChatPanel item={item} imageId={imageId} onResults={updateResults} />
    </div>
  );
}
