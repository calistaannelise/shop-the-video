"use client";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

const TIER_LABEL = { budget: "Budget", mid: "Mid", higher: "Higher" } as const;

// TODO (Person C): styling pass
export default function ProductCard({ product, why, isOriginal }: { product: Product; why?: string; isOriginal?: boolean }) {
  const { addToCart } = useStore();
  return (
    <div className="rounded-xl border p-3 flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image_url} alt={product.title} className="aspect-[4/5] w-full object-cover rounded-lg" />
      <span className="text-xs font-semibold uppercase">{isOriginal ? "Original" : TIER_LABEL[product.tier]}</span>
      <div className="text-sm">{product.brand}</div>
      <div className="font-medium">{product.title}</div>
      <div>${product.price.toFixed(2)}</div>
      {why && <p className="text-xs opacity-70">{why}</p>}
      <button onClick={() => addToCart(product)} className="mt-auto rounded-lg bg-black text-white py-2 text-sm">
        Add to cart
      </button>
    </div>
  );
}
