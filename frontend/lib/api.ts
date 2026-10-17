// Keep the shared backend contracts unchanged. Live mode never falls back to fixtures.
import { mockExtract, mockRefine, mockSearch } from "./mocks";
import type {
  ExtractResponse,
  RefineRequest,
  RefineResponse,
  SearchRequest,
  SearchResponse,
} from "./types";
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";
const DEMO = process.env.NEXT_PUBLIC_DEMO === "1" ? "?demo=1" : "";
const delay = <T>(value: T, ms = 600) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
async function post<T>(path: string, body: BodyInit, json = true): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${DEMO}`, {
      method: "POST",
      body,
      headers: json ? { "Content-Type": "application/json" } : undefined,
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw new Error(
      "We couldn’t connect to the styling service. Please try again in a moment.",
    );
  }
  if (!res.ok)
    throw new Error(
      res.status === 413
        ? "That image is too large. Please try a smaller screenshot."
        : res.status === 429
          ? "The stylist is busy right now. Please try again shortly."
          : "The styling service couldn’t complete your request. Please try again.",
    );
  return res.json();
}
export async function extract(
  image: File,
  caption?: string,
): Promise<ExtractResponse> {
  if (USE_MOCKS) return delay(mockExtract, 1200);
  const form = new FormData();
  form.append("image", image);
  if (caption) form.append("caption", caption);
  return post("/extract", form, false);
}
export async function search(req: SearchRequest): Promise<SearchResponse> {
  if (USE_MOCKS) return delay(mockSearch);
  return post("/search", JSON.stringify(req));
}
export async function refine(req: RefineRequest): Promise<RefineResponse> {
  if (USE_MOCKS) return delay(mockRefine);
  return post("/refine", JSON.stringify(req));
}
