"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { money, retailerUrl } from "@/lib/format";
import type { Product } from "@/lib/types";
import ProductImage from "./ProductImage";
import Icon from "./Icon";
const TIER_LABEL = {
  budget: "Budget find",
  mid: "Mid-range",
  higher: "Higher-end",
} as const;
export default function ProductCard({
  product,
  why,
  isOriginal,
  itemId,
}: {
  product: Product;
  why?: string;
  isOriginal?: boolean;
  itemId: string;
}) {
  const { addToCart, outfit, selectProduct } = useStore();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const selected = outfit[itemId]?.id === product.id;
  const url = retailerUrl(product.product_url);
  return (
    <article className={`product-card ${selected ? "selected" : ""}`}>
      <div className="product-image-wrap">
        <ProductImage
          src={product.image_url}
          alt={`${product.brand} ${product.title}`}
        />
        <span className={`product-badge ${isOriginal ? "original" : ""}`}>
          {isOriginal ? "Brand match" : TIER_LABEL[product.tier]}
        </span>
        <button
          className="select-product"
          onClick={() => selectProduct(itemId, product)}
          aria-label={`${selected ? "Remove" : "Select"} ${product.title} ${selected ? "from" : "for"} your look`}
          aria-pressed={selected}
        >
          <Icon name={selected ? "check" : "plus"} size={18} />
        </button>
      </div>
      <div className="product-info">
        <div className="product-brand">
          <span>{product.brand}</span>
          <strong>{money(product.price)}</strong>
        </div>
        <h3>{product.title}</h3>
        <p className="product-color">
          {product.colors.join(" / ") || product.category}
        </p>
        {why && <p className="match-reason">{why}</p>}
        <div className="product-actions">
          <button
            className={`button button-add ${added ? "added" : ""}`}
            onClick={() => {
              addToCart(product);
              setAdded(true);
              clearTimeout(timer.current);
              timer.current = setTimeout(() => setAdded(false), 1800);
            }}
          >
            <span aria-live="polite">
              {added ? "Added to bag" : "Add to bag"}
            </span>
            <Icon name={added ? "check" : "plus"} size={16} />
          </button>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="retailer-link"
              aria-label={`View ${product.title} at ${product.brand}`}
            >
              <Icon name="external" size={16} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
