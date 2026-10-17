"use client";
import Link from "next/link";
import { useState } from "react";
import ItemCard from "@/components/ItemCard";
import Icon from "@/components/Icon";
import ProductImage from "@/components/ProductImage";
import { useStore } from "@/lib/store";
import { money } from "@/lib/format";
export default function ResultsPage() {
  const {
    extraction,
    inspiration,
    outfit,
    addToCart,
    setCartOpen,
    selectProduct,
  } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  if (!extraction)
    return (
      <main id="main" className="empty-page page-width">
        <Icon name="scan" size={46} />
        <p className="eyebrow">A NEW LOOK STARTS HERE.</p>
        <h1>Let’s find your inspiration.</h1>
        <p>Upload an outfit screenshot to discover your matches.</p>
        <Link href="/" className="button button-primary">
          Find my look <Icon name="arrow" />
        </Link>
      </main>
    );
  const activeId = selected ?? extraction.items[0]?.id;
  const chosen = Object.entries(outfit);
  const total = chosen.reduce((sum, [, product]) => sum + product.price, 0);
  return (
    <main id="main" className="results-page page-width">
      <div className="results-topline">
        <Link href="/" className="back-link">
          ← Find another look
        </Link>
        <span>
          01 INSPIRATION <span className="line" />{" "}
          <strong>02 MAKE IT YOURS</strong> <span className="line" /> 03 YOUR
          BAG
        </span>
      </div>
      <div className="results-title">
        <div>
          <p className="eyebrow">
            <span className="red-dot" /> YOUR INSPIRATION, REIMAGINED.
          </p>
          <h1>
            Same vibe. <span>Your version.</span>
          </h1>
        </div>
        <p>A few good finds. A look that’s all you.</p>
      </div>
      <div className="results-layout">
        <aside className="inspiration-sidebar">
          <div className="sidebar-heading">
            <h2>The inspiration</h2>
            <Icon name="scan" size={18} />
          </div>
          <div className="inspiration-image">
            {inspiration && (
              <ProductImage
                src={inspiration}
                alt="Your uploaded outfit inspiration"
              />
            )}
            <span className="inspo-label">YOUR ORIGINAL LOOK</span>
          </div>
          <div className="detected-header">
            <h3>Spotted in your look</h3>
            <span>{extraction.items.length}</span>
          </div>
          <div
            role="tablist"
            aria-label="Detected clothing pieces"
            aria-orientation="vertical"
            className="detected-items"
          >
            {extraction.items.map((item, index) => (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                role="tab"
                aria-selected={activeId === item.id}
                aria-controls={`panel-${item.id}`}
                tabIndex={activeId === item.id ? 0 : -1}
                className={activeId === item.id ? "active" : ""}
                onClick={() => setSelected(item.id)}
                onKeyDown={(e) => {
                  const delta =
                    e.key === "ArrowDown" || e.key === "ArrowRight"
                      ? 1
                      : e.key === "ArrowUp" || e.key === "ArrowLeft"
                        ? -1
                        : 0;
                  if (delta || e.key === "Home" || e.key === "End") {
                    e.preventDefault();
                    const next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? extraction.items.length - 1
                          : (index + delta + extraction.items.length) %
                            extraction.items.length;
                    setSelected(extraction.items[next].id);
                    document
                      .getElementById(`tab-${extraction.items[next].id}`)
                      ?.focus();
                  }
                }}
              >
                <span className="detected-number">0{index + 1}</span>
                <span>
                  <strong>{item.type}</strong>
                  <small>
                    {[item.color, item.material].filter(Boolean).join(" · ") ||
                      item.category}
                  </small>
                </span>
                <Icon name={outfit[item.id] ? "check" : "chevron"} size={16} />
              </button>
            ))}
          </div>
          <div className="outfit-builder">
            <div className="sidebar-heading">
              <h2>Your look</h2>
              <span>
                {chosen.length}/{extraction.items.length}
              </span>
            </div>
            {chosen.length ? (
              <>
                <div className="outfit-pieces">
                  {chosen.map(([id, product]) => (
                    <div key={id}>
                      <ProductImage
                        src={product.image_url}
                        alt={product.title}
                      />
                      <span>
                        {product.title}
                        <strong>{money(product.price)}</strong>
                      </span>
                      <button
                        className="icon-button"
                        aria-label={`Remove ${product.title} from outfit`}
                        onClick={() => selectProduct(id, product)}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="outfit-total">
                  <span>Estimated total</span>
                  <strong>{money(total)}</strong>
                </div>
                <button
                  className="button button-dark"
                  onClick={() => {
                    chosen.forEach(([, p]) => addToCart(p));
                    setAdded(true);
                    setCartOpen(true);
                  }}
                >
                  Add look to bag <Icon name="bag" size={17} />
                </button>
                {added && (
                  <span className="sr-only" role="status">
                    Your selected look was added to your bag.
                  </span>
                )}
              </>
            ) : (
              <div className="outfit-empty">
                <span className="dashed-plus">
                  <Icon name="plus" />
                </span>
                <p>
                  See a favorite? Tap <strong>+</strong> on a piece to build
                  your look.
                </p>
              </div>
            )}
          </div>
        </aside>
        <div className="results-content">
          {extraction.items.map((item) => (
            <ItemCard
              key={`${extraction.image_id}-${item.id}`}
              item={item}
              imageId={extraction.image_id}
              active={activeId === item.id}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
