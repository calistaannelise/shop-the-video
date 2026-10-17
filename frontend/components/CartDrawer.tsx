"use client";
// Cart grouped by brand + total. TODO (Person C): make this a slide-out drawer.
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

export default function CartDrawer() {
  const { cart, removeFromCart } = useStore();
  const byBrand = cart.reduce<Record<string, Product[]>>((acc, p) => {
    (acc[p.brand] ??= []).push(p);
    return acc;
  }, {});
  const total = cart.reduce((sum, p) => sum + p.price, 0);

  if (cart.length === 0) return null;

  return (
    <aside className="rounded-xl border p-4 flex flex-col gap-3">
      <h3 className="font-semibold">Cart ({cart.length})</h3>
      {Object.entries(byBrand).map(([brand, items]) => (
        <div key={brand}>
          <div className="text-xs uppercase opacity-70">{brand}</div>
          {items.map((p) => (
            <div key={p.id} className="flex justify-between text-sm">
              <span>{p.title}</span>
              <span>
                ${p.price.toFixed(2)}{" "}
                <button onClick={() => removeFromCart(p.id)} className="opacity-50">✕</button>
              </span>
            </div>
          ))}
        </div>
      ))}
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
      <Link href="/checkout" className="rounded-lg bg-black text-white py-2 text-center text-sm">
        Checkout
      </Link>
    </aside>
  );
}
