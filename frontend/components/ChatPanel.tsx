"use client";
// Chat refinement under each item's results -> POST /refine. Owner: Person C (UI), Person B (logic).
import { useState } from "react";
import { refine } from "@/lib/api";
import { ALL_TIERS, type Filters, type Item, type SearchResult } from "@/lib/types";

export default function ChatPanel({
  item,
  imageId,
  onResults,
}: {
  item: Item;
  imageId: string;
  onResults: (r: SearchResult[]) => void;
}) {
  const [filters, setFilters] = useState<Filters>({ tiers: ALL_TIERS, overrides: {} });
  const [messages, setMessages] = useState<{ from: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const message = input.trim();
    if (!message) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text: message }]);
    setLoading(true);
    try {
      const res = await refine({ item, image_id: imageId, current: filters, message });
      setFilters(res.filters);
      onResults(res.results);
      setMessages((m) => [...m, { from: "ai", text: res.reply }]);
    } catch {
      setMessages((m) => [...m, { from: "ai", text: "Sorry, something went wrong. Try again?" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border p-3 flex flex-col gap-2">
      {messages.map((m, i) => (
        <p key={i} className={m.from === "user" ? "self-end text-sm" : "self-start text-sm opacity-80"}>
          {m.text}
        </p>
      ))}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Try "cheaper and in black"'
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button disabled={loading} className="rounded-lg bg-black text-white px-4 text-sm disabled:opacity-50">
          {loading ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
