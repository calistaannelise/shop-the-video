"use client";
// Client-side app state: the current extraction + the cart. No backend needed.
import { createContext, useContext, useState } from "react";
import type { ExtractResponse, Product } from "./types";

interface Store {
  extraction: ExtractResponse | null;
  setExtraction: (e: ExtractResponse | null) => void;
  cart: Product[];
  addToCart: (p: Product) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [extraction, setExtraction] = useState<ExtractResponse | null>(null);
  const [cart, setCart] = useState<Product[]>([]);

  return (
    <StoreContext.Provider
      value={{
        extraction,
        setExtraction,
        cart,
        addToCart: (p) => setCart((c) => (c.some((x) => x.id === p.id) ? c : [...c, p])),
        removeFromCart: (id) => setCart((c) => c.filter((x) => x.id !== id)),
        clearCart: () => setCart([]),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
