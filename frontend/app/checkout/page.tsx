"use client";
// Mock checkout — no real payments. TODO (Person C): polish card form + confirmation screen.
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";

export default function CheckoutPage() {
  const { cart, clearCart } = useStore();
  const [placed, setPlaced] = useState<{ stores: number; total: number } | null>(null);
  const total = cart.reduce((sum, p) => sum + p.price, 0);
  const stores = new Set(cart.map((p) => p.brand)).size;

  if (placed) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Order placed across {placed.stores} stores</h1>
        <p>Total charged: ${placed.total.toFixed(2)}</p>
        <Link href="/" className="underline">Shop another look</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p>{cart.length} items from {stores} stores · ${total.toFixed(2)}</p>
      <input className="rounded-lg border px-3 py-2" defaultValue="4242 4242 4242 4242" aria-label="Card number" />
      <div className="flex gap-2">
        <input className="flex-1 rounded-lg border px-3 py-2" defaultValue="12/28" aria-label="Expiry" />
        <input className="flex-1 rounded-lg border px-3 py-2" defaultValue="123" aria-label="CVC" />
      </div>
      <button
        disabled={cart.length === 0}
        onClick={() => {
          setPlaced({ stores, total });
          clearCart();
        }}
        className="rounded-lg bg-black text-white py-3 disabled:opacity-50"
      >
        Pay ${total.toFixed(2)}
      </button>
    </main>
  );
}
