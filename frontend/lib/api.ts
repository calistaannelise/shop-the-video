// API calls + mock toggle.
// NEXT_PUBLIC_USE_MOCKS=1 -> never hits the backend (build UI before the API is ready)
// NEXT_PUBLIC_DEMO=1      -> backend serves data/demo_cache.json (demo-day safety net)
import { mockExtract, mockRefine, mockSearch } from "./mocks";
import type { ExtractResponse, RefineRequest, RefineResponse, SearchRequest, SearchResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";
const DEMO = process.env.NEXT_PUBLIC_DEMO === "1" ? "?demo=1" : "";

const delay = <T,>(value: T, ms = 600) => new Promise<T>((r) => setTimeout(() => r(value), ms));

async function post<T>(path: string, body: BodyInit, json = true): Promise<T> {
  const res = await fetch(`${API_URL}${path}${DEMO}`, {
    method: "POST",
    body,
    headers: json ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function extract(image: File, caption?: string): Promise<ExtractResponse> {
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
