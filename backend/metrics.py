"""Prometheus metrics for the search backend. Owner: Person A.

Exposes GET /metrics (via the instrumentator) so Prometheus/Grafana can chart:
  - stylist_catalog_products        how many SKUs are indexed
  - stylist_search_latency_seconds  search_item() latency (p50/p95/p99)
  - stylist_search_requests_total   -> QPS via rate()
  - stylist_cache_ops_total{cache,result}  -> cache hit ratio

Cache hit ratio (PromQL):
  sum(rate(stylist_cache_ops_total{result="hit"}[1m]))
  / sum(rate(stylist_cache_ops_total[1m]))
"""
from prometheus_client import Counter, Gauge, Histogram
from prometheus_fastapi_instrumentator import Instrumentator

CATALOG_SIZE = Gauge("stylist_catalog_products", "Products currently indexed")
SEARCH_REQUESTS = Counter("stylist_search_requests_total", "search_item() calls")
SEARCH_LATENCY = Histogram("stylist_search_latency_seconds", "search_item() latency (s)")
CACHE_OPS = Counter(
    "stylist_cache_ops_total", "Cache lookups", ["cache", "result"]
)


def record_cache(cache_name: str, hit: bool) -> None:
    CACHE_OPS.labels(cache=cache_name, result="hit" if hit else "miss").inc()


def instrument(app) -> None:
    """Attach default HTTP metrics and expose GET /metrics."""
    Instrumentator().instrument(app).expose(app)
