"use client";
// Upload screen. TODO (Person C): drag/drop, nicer loading state, mobile camera roll polish.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { extract } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function UploadPage() {
  const router = useRouter();
  const { setExtraction } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      setExtraction(await extract(file));
      router.push("/results");
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 flex flex-col items-center gap-6 text-center">
      <h1 className="text-3xl font-bold">Shop the look</h1>
      <p className="opacity-70">Screenshot an outfit. We&apos;ll find it — and dupes at every price.</p>
      {loading ? (
        <p>Finding your look…</p>
      ) : (
        <label className="w-full rounded-xl border-2 border-dashed p-10 cursor-pointer">
          Upload a screenshot
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </main>
  );
}
