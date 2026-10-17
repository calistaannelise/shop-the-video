"use client";
// One detected item: attribute chips + its search results + chat refinement.
import { useEffect, useState } from "react";
import { search } from "@/lib/api";
import type { Item, SearchResponse, SearchResult } from "@/lib/types";
import ChatPanel from "./ChatPanel";
import ProductCard from "./ProductCard";

export default function ItemCard({ item, imageId }: { item: Item; imageId: string }) {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    search({ item, image_id: imageId }).then(setData).catch((e) => setError(String(e)));
  }, [item, imageId]);

  const chips = [item.type, item.color, item.fit, item.material, item.vibe].filter(Boolean);
  const setResults = (results: SearchResult[]) => setData((d) => (d ? { ...d, results } : d));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold capitalize">{item.type}</h2>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <span key={c} className="rounded-full border px-3 py-1 text-xs">{c}</span>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!data && !error && <p className="text-sm opacity-70">Finding matches…</p>}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.original && <ProductCard product={data.original.product} isOriginal />}
          {data.results.map((r) => (
            <ProductCard key={r.product.id} product={r.product} why={r.why} />
          ))}
        </div>
      )}

      <ChatPanel item={item} imageId={imageId} onResults={setResults} />
    </section>
  );
}
