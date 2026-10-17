"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { money } from "@/lib/format";
import Icon from "./Icon";
import ProductImage from "./ProductImage";
export default function CartDrawer() {
  const { cart, removeFromCart, setQuantity, cartOpen, setCartOpen } =
    useStore();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (cartOpen && !el.open) el.showModal();
    if (!cartOpen && el.open) el.close();
    if (cartOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [cartOpen]);
  const total = cart.reduce(
    (n, line) => n + line.product.price * line.quantity,
    0,
  );
  const count = cart.reduce((n, line) => n + line.quantity, 0);
  const brands = [...new Set(cart.map((line) => line.product.brand))];
  return (
    <dialog
      ref={dialog}
      className="cart-dialog"
      aria-labelledby="bag-title"
      onCancel={() => setCartOpen(false)}
      onClose={() => setCartOpen(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) setCartOpen(false);
      }}
    >
      <div className="cart-content">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">GOOD FINDS, ALL TOGETHER.</p>
            <h2 id="bag-title">
              Your bag <span>({count})</span>
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={() => setCartOpen(false)}
            aria-label="Close shopping bag"
          >
            <Icon name="close" />
          </button>
        </div>
        {cart.length ? (
          <>
            <div className="cart-lines">
              {brands.map((brand) => (
                <section key={brand} className="cart-brand">
                  <h3>{brand}</h3>
                  {cart
                    .filter((line) => line.product.brand === brand)
                    .map(({ product, quantity }) => (
                      <article className="cart-line" key={product.id}>
                        <ProductImage
                          src={product.image_url}
                          alt={product.title}
                        />
                        <div className="cart-line-details">
                          <strong>{product.title}</strong>
                          <span>
                            {product.colors.join(" / ") || product.category}
                          </span>
                          <div className="quantity-control">
                            <button
                              onClick={() =>
                                setQuantity(product.id, quantity - 1)
                              }
                              aria-label={`Decrease quantity of ${product.title}`}
                            >
                              <Icon name="minus" size={14} />
                            </button>
                            <span aria-label={`Quantity ${quantity}`}>
                              {quantity}
                            </span>
                            <button
                              disabled={quantity >= 99}
                              onClick={() =>
                                setQuantity(product.id, quantity + 1)
                              }
                              aria-label={`Increase quantity of ${product.title}`}
                            >
                              <Icon name="plus" size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="cart-line-end">
                          <strong>{money(product.price * quantity)}</strong>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            aria-label={`Remove ${product.title}`}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    ))}
                </section>
              ))}
            </div>
            <div className="cart-summary">
              <div>
                <span>Estimated subtotal</span>
                <strong>{money(total)}</strong>
              </div>
              <p>Shipping and taxes are set by each retailer.</p>
              <Link
                className="button button-primary"
                href="/checkout"
                onClick={() => setCartOpen(false)}
              >
                Review your bag <Icon name="arrow" />
              </Link>
              <small>You’ll complete your purchase with each retailer.</small>
            </div>
          </>
        ) : (
          <div className="empty-bag">
            <Icon name="bag" size={45} />
            <h3>Your next favorites belong here.</h3>
            <p>Find a look you love and add a few pieces.</p>
            <button
              className="button button-dark"
              onClick={() => setCartOpen(false)}
            >
              Keep exploring <Icon name="arrow" />
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
