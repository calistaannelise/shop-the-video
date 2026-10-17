"""Shared LLM client. Owner: Person B.

One place to talk to the vision/chat model and get strict JSON back, with a
single automatic retry on malformed output. Swap the provider here (model
names / SDK) without touching extract.py, rerank.py, or refine.py.

Provider is env-configurable via the OpenAI SDK. Default: OpenAI (gpt-4o for
vision /extract, gpt-4o-mini for rerank/refine). Point LLM_BASE_URL / LLM_*_MODEL
elsewhere (e.g. an OpenAI-compatible endpoint) to switch providers.
Reads LLM_API_KEY from the environment (main.py already load_dotenv()'s .env).
"""
import base64
import json
import os
from pathlib import Path
from typing import Any

from openai import OpenAI

BASE_URL = os.getenv("LLM_BASE_URL") or None  # None -> OpenAI default endpoint
VISION_MODEL = os.getenv("LLM_VISION_MODEL", "gpt-4o")
TEXT_MODEL = os.getenv("LLM_TEXT_MODEL", "gpt-4o-mini")

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        key = os.getenv("LLM_API_KEY")
        if not key:
            raise RuntimeError("LLM_API_KEY is not set (copy .env.example -> .env)")
        _client = OpenAI(api_key=key, base_url=BASE_URL)
    return _client


def _encode_image(image_path: Path) -> str:
    data = base64.b64encode(Path(image_path).read_bytes()).decode()
    suffix = (Path(image_path).suffix.lstrip(".") or "jpeg").lower()
    if suffix == "jpg":
        suffix = "jpeg"
    return f"data:image/{suffix};base64,{data}"


def call_json(
    messages: list[dict[str, Any]],
    model: str = TEXT_MODEL,
    image_path: Path | None = None,
) -> Any:
    """Call the model in JSON mode and return parsed JSON.

    If `image_path` is given, the image is attached to the last user message
    (vision call). On a JSON parse failure we nudge the model once and retry;
    a second failure raises so callers can fall back to a safe default.
    """
    client = _get_client()
    msgs: list[dict[str, Any]] = [dict(m) for m in messages]

    if image_path is not None:
        last = msgs[-1]
        text = last.get("content", "")
        last["content"] = [
            {"type": "text", "text": text if isinstance(text, str) else ""},
            {"type": "image_url", "image_url": {"url": _encode_image(Path(image_path))}},
        ]

    for attempt in range(2):
        resp = client.chat.completions.create(
            model=model,
            messages=msgs,
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        raw = resp.choices[0].message.content or ""
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            if attempt == 0:
                msgs.append({"role": "assistant", "content": raw})
                msgs.append(
                    {
                        "role": "user",
                        "content": "That was not valid JSON. Reply with ONLY valid JSON matching the requested schema, no prose, no markdown.",
                    }
                )
            else:
                raise
