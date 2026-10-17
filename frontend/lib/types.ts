// Data contracts. Mirror of backend/schemas.py — change both together.

export type Category = "top" | "bottom" | "dress" | "outerwear" | "shoes" | "bag" | "accessory";
export type Tier = "budget" | "mid" | "higher";
export const ALL_TIERS: Tier[] = ["budget", "mid", "higher"];

export interface Product {
  id: string;
  brand: string;
  tier: Tier;
  category: Category;
  title: string;
  price: number;
  colors: string[];
  image_url: string;
  product_url: string;
}

export interface Item {
  id: string;
  category: Category;
  type: string;
  color: string | null;
  fit: string | null;
  material: string | null;
  vibe: string | null;
  brand_guess: string | null;
  description: string;
}

export interface ExtractResponse {
  image_id: string;
  items: Item[];
  caption_brands: string[];
}

export interface SearchRequest {
  item: Item;
  image_id?: string;
  tiers?: Tier[];
  k?: number;
  overrides?: Record<string, string>;
}

export interface SearchResult {
  product: Product;
  score: number;
  why: string;
}

export interface SearchResponse {
  original: { product: Product; confidence: "high" | "medium" | "low" } | null;
  results: SearchResult[];
}

export interface Filters {
  tiers: Tier[];
  overrides: Record<string, string>;
}

export interface RefineRequest {
  item: Item;
  image_id?: string;
  current: Filters;
  message: string;
}

export interface RefineResponse {
  filters: Filters;
  reply: string;
  results: SearchResult[];
}
