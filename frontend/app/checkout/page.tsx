"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { money, retailerUrl } from "@/lib/format";
import ProductImage from "@/components/ProductImage";
import Icon from "@/components/Icon";
export default function CheckoutPage() {
  const { cart, removeFromCart, setQuantity, hydrated } = useStore();
  const total = cart.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const brands = [...new Set(cart.map((line) => line.product.brand))];
  return (
    <main id="main" className="checkout-page page-width">
      <Link href="/results" className="back-link">
        ← Back to your look
      </Link>
      <p className="eyebrow">YOUR FINDS. ALL IN ONE PLACE.</p>
      <h1>
        Good taste. Great finds<span>.</span>
      </h1>
      <p className="checkout-intro">
        Review your look, then make it yours with each retailer.
      </p>
      {!hydrated ? (
        <p role="status">Loading your bag…</p>
      ) : !cart.length ? (
        <div className="state-card">
          <Icon name="bag" size={40} />
          <h2>Your bag is waiting for a good find.</h2>
          <Link className="button button-primary" href="/">
            Find my look <Icon name="arrow" />
          </Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <div>
            {brands.map((brand) => (
              <section key={brand} className="checkout-brand">
                <div className="sidebar-heading">
                  <h2>{brand}</h2>
                  <span>RETAILER</span>
                </div>
                {cart
                  .filter((line) => line.product.brand === brand)
                  .map(({ product, quantity }) => {
                    const url = retailerUrl(product.product_url);
                    return (
                      <article key={product.id} className="checkout-line">
                        <ProductImage
                          src={product.image_url}
                          alt={product.title}
                        />
                        <div>
                          <h3>{product.title}</h3>
                          <p>
                            {product.colors.join(" / ") || product.category}
                          </p>
                          <div className="quantity-control">
                            <button
                              onClick={() =>
                                setQuantity(product.id, quantity - 1)
                              }
                              aria-label={`Decrease quantity of ${product.title}`}
                            >
                              <Icon name="minus" size={14} />
                            </button>
                            <span>{quantity}</span>
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
                          <button
                            className="remove-link"
                            onClick={() => removeFromCart(product.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="checkout-line-price">
                          <strong>{money(product.price * quantity)}</strong>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-link"
                            >
                              Shop at retailer{" "}
                              <Icon name="external" size={14} />
                            </a>
                          ) : (
                            <span className="unavailable-link">
                              Retailer link unavailable
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
              </section>
            ))}
          </div>
          <aside className="checkout-summary">
            <p className="eyebrow">THE LOOK, AT A GLANCE.</p>
            <h2>Your bag summary</h2>
            <div>
              <span>
                {count} {count === 1 ? "piece" : "pieces"} · {brands.length}{" "}
                {brands.length === 1 ? "retailer" : "retailers"}
              </span>
              <strong>{money(total)}</strong>
            </div>
            <div>
              <span>Shipping & taxes</span>
              <span>Set by retailers</span>
            </div>
            <div className="summary-total">
              <strong>Estimated subtotal</strong>
              <strong>{money(total)}</strong>
            </div>
            <div className="checkout-notice">
              <Icon name="external" size={22} />
              <h3>A little heads-up.</h3>
              <p>
                This is a checkout preview. Use each product’s retailer link to
                confirm its price, size, stock, shipping, and returns, then
                complete your purchase there.
              </p>
              <p>
                No payment is collected here, and items are not reserved or
                automatically added to a retailer’s cart.
              </p>
            </div>
            <Link href="/results" className="button button-dark">
              Keep finding favorites <Icon name="arrow" />
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
