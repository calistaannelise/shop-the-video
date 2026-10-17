"use client";
import { useEffect, useRef, useState } from "react";
import { refine } from "@/lib/api";
import {
  ALL_TIERS,
  type Filters,
  type Item,
  type SearchResult,
} from "@/lib/types";
import Icon from "./Icon";
export default function ChatPanel({
  item,
  imageId,
  onResults,
}: {
  item: Item;
  imageId: string;
  onResults: (results: SearchResult[]) => void;
}) {
  const [filters, setFilters] = useState<Filters>({
    tiers: ALL_TIERS,
    overrides: {},
  });
  const [messages, setMessages] = useState<
    { from: "user" | "ai"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  useEffect(() => {
    if (messages.length)
      end.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [messages, loading]);
  async function send(message: string) {
    if (!message.trim() || busy.current) return;
    busy.current = true;
    setInput("");
    setError(null);
    setLoading(true);
    setMessages((m) => [...m, { from: "user", text: message }]);
    try {
      const res = await refine({
        item,
        image_id: imageId,
        current: filters,
        message,
      });
      setFilters(res.filters);
      onResults(res.results);
      setMessages((m) => [...m, { from: "ai", text: res.reply }]);
    } catch {
      setError("Your stylist couldn’t connect. Please try again.");
      setInput(message);
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }
  return (
    <section className="chat-panel" aria-labelledby={`chat-${item.id}`}>
      <div className="chat-title">
        <span className="stylist-icon">
          <Icon name="spark" />
        </span>
        <div>
          <h2 id={`chat-${item.id}`}>Refine your look</h2>
          <p>A little more you.</p>
        </div>
        <span className="red-dot" />
      </div>
      <p className="chat-context">
        Let’s find your kind of <strong>{item.type}</strong>. Tell me what you’d
        change.
      </p>
      <div
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message, index) => (
          <div key={index} className={`chat-message ${message.from}`}>
            <span>{message.from === "ai" ? "SPOTT. STYLIST" : "YOU"}</span>
            <p>{message.text}</p>
          </div>
        ))}
        {loading && (
          <div className="chat-thinking">
            <span className="spinner" /> Finding a fresh take…
          </div>
        )}
        <div ref={end} />
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="suggested-prompts">
        {[
          "Find cheaper alternatives",
          "Make this more casual",
          "Try another color",
        ].map((prompt) => (
          <button key={prompt} disabled={loading} onClick={() => send(prompt)}>
            {prompt}
            <Icon name="plus" size={13} />
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="chat-form"
      >
        <label className="sr-only" htmlFor={`message-${item.id}`}>
          Ask the stylist about {item.type}
        </label>
        <input
          id={`message-${item.id}`}
          placeholder="Make it more me…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send styling request"
        >
          <Icon name="arrow" size={19} />
        </button>
      </form>
      <p className="chat-footnote">
        A fresh perspective, whenever you need it.
      </p>
    </section>
  );
}
