"""Data contracts shared by every endpoint. Mirror of frontend/lib/types.ts.

Change these only after telling the whole team — the frontend mocks depend on them.
"""
from typing import Literal, Optional

from pydantic import BaseModel, Field

Category = Literal["top", "bottom", "dress", "outerwear", "shoes", "bag", "accessory"]
Tier = Literal["budget", "mid", "higher"]
ALL_TIERS: list[Tier] = ["budget", "mid", "higher"]


class Product(BaseModel):
    id: str
    brand: str
    tier: Tier
    category: Category
    title: str
    price: float
    colors: list[str] = []
    image_url: str
    product_url: str


class Item(BaseModel):
    id: str
    category: Category
    type: str
    color: Optional[str] = None
    fit: Optional[str] = None
    material: Optional[str] = None
    vibe: Optional[str] = None
    brand_guess: Optional[str] = None
    description: str


# --- /extract ---
class ExtractResponse(BaseModel):
    image_id: str  # pass back to /search so it can reuse the uploaded image
    items: list[Item]
    caption_brands: list[str] = []


# --- /search ---
class SearchRequest(BaseModel):
    item: Item
    image_id: Optional[str] = None
    tiers: list[Tier] = Field(default_factory=lambda: list(ALL_TIERS))
    k: int = 3
    overrides: dict[str, str] = {}  # e.g. {"color": "black"} from /refine


class Original(BaseModel):
    product: Product
    confidence: Literal["high", "medium", "low"]


class SearchResult(BaseModel):
    product: Product
    score: float
    why: str


class SearchResponse(BaseModel):
    original: Optional[Original] = None  # null when no brand detected
    results: list[SearchResult]


# --- /refine ---
class Filters(BaseModel):
    tiers: list[Tier] = Field(default_factory=lambda: list(ALL_TIERS))
    overrides: dict[str, str] = {}


class RefineRequest(BaseModel):
    item: Item
    image_id: Optional[str] = None
    current: Filters = Field(default_factory=Filters)
    message: str


class RefineResponse(BaseModel):
    filters: Filters
    reply: str
    results: list[SearchResult]
