// Existing sample product metadata; local illustrations are not retailer photos.
// Mock responses that match the contracts exactly. Used when NEXT_PUBLIC_USE_MOCKS=1.
import type {
  ExtractResponse,
  Item,
  Product,
  RefineResponse,
  SearchResponse,
} from "./types";

const img = (brand: string) =>
  `/images/demo-jacket-${["Cider", "Edikted", "Reformation", "Aritzia"].indexOf(brand) + 1}.svg`;

const products: Product[] = [
  {
    id: "sample_cider_01",
    brand: "Cider",
    tier: "budget",
    category: "outerwear",
    title: "Cropped Denim Jacket",
    price: 32,
    colors: ["black"],
    image_url: img("Cider"),
    product_url: "#",
  },
  {
    id: "sample_edikted_01",
    brand: "Edikted",
    tier: "mid",
    category: "outerwear",
    title: "Oversized Denim Jacket",
    price: 62,
    colors: ["black"],
    image_url: img("Edikted"),
    product_url: "#",
  },
  {
    id: "sample_ref_01",
    brand: "Reformation",
    tier: "higher",
    category: "outerwear",
    title: "Cropped Denim Jacket",
    price: 178,
    colors: ["black"],
    image_url: img("Reformation"),
    product_url: "#",
  },
  {
    id: "sample_aritzia_01",
    brand: "Aritzia",
    tier: "higher",
    category: "outerwear",
    title: "Oversized Trucker Jacket",
    price: 148,
    colors: ["black"],
    image_url: img("Aritzia"),
    product_url: "#",
  },
];

export const mockItem: Item = {
  id: "item_1",
  category: "outerwear",
  type: "cropped jacket",
  color: "black",
  fit: "oversized",
  material: "denim",
  vibe: "streetwear",
  brand_guess: "Aritzia",
  description: "black oversized cropped denim jacket",
};

export const mockExtract: ExtractResponse = {
  image_id: "upload_mock",
  items: [mockItem],
  caption_brands: [],
};

export const mockSearch: SearchResponse = {
  original: { product: products[3], confidence: "high" },
  results: [
    {
      product: products[0],
      score: 0.82,
      why: "Same cropped boxy cut in washed black denim",
    },
    {
      product: products[1],
      score: 0.79,
      why: "Oversized fit and black wash match closely",
    },
    {
      product: products[2],
      score: 0.76,
      why: "Same silhouette in premium denim",
    },
  ],
};

export const mockRefine: RefineResponse = {
  filters: { tiers: ["budget"], overrides: { color: "black" } },
  reply: "Here are budget picks in black.",
  results: [mockSearch.results[0]],
};
