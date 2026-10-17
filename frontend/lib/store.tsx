"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { ExtractResponse, Product } from "./types";

export interface CartLine {
  product: Product;
  quantity: number;
}
interface Store {
  extraction: ExtractResponse | null;
  setExtraction: (e: ExtractResponse | null) => void;
  inspiration: string | null;
  setInspiration: (url: string | null) => void;
  cart: CartLine[];
  addToCart: (p: Product) => void;
  removeFromCart: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  outfit: Record<string, Product>;
  selectProduct: (itemId: string, p: Product) => void;
  resetOutfit: () => void;
  hydrated: boolean;
}
const StoreContext = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [extraction, setExtraction] = useState<ExtractResponse | null>(null);
  const [inspiration, setInspiration] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [outfit, setOutfit] = useState<Record<string, Product>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("spott-cart-v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed))
          setCart(
            parsed.filter(
              (line) =>
                line?.product?.id &&
                Number.isFinite(line.product.price) &&
                Number.isInteger(line.quantity) &&
                line.quantity > 0,
            ),
          );
      }
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem("spott-cart-v1", JSON.stringify(cart));
      } catch {
        /* Cart still works in memory. */
      }
    }
  }, [cart, hydrated]);
  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      return existing
        ? current.map((line) =>
            line.product.id === product.id
              ? { ...line, quantity: Math.min(99, line.quantity + 1) }
              : line,
          )
        : [...current, { product, quantity: 1 }];
    });
  }
  return (
    <StoreContext.Provider
      value={{
        extraction,
        setExtraction,
        inspiration,
        setInspiration,
        cart,
        addToCart,
        removeFromCart: (id) =>
          setCart((c) => c.filter((line) => line.product.id !== id)),
        setQuantity: (id, quantity) =>
          setCart((c) =>
            quantity <= 0
              ? c.filter((line) => line.product.id !== id)
              : c.map((line) =>
                  line.product.id === id
                    ? { ...line, quantity: Math.min(99, quantity) }
                    : line,
                ),
          ),
        clearCart: () => setCart([]),
        cartOpen,
        setCartOpen,
        outfit,
        selectProduct: (id, p) =>
          setOutfit((o) =>
            o[id]?.id === p.id
              ? Object.fromEntries(
                  Object.entries(o).filter(([key]) => key !== id),
                )
              : { ...o, [id]: p },
          ),
        resetOutfit: () => setOutfit({}),
        hydrated,
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
