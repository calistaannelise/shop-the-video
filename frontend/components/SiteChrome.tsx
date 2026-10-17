"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import Icon from "./Icon";
import CartDrawer from "./CartDrawer";
import styles from "./SiteChrome.module.css";

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const { cart, setCartOpen, extraction } = useStore();
  const path = usePathname();
  const count = cart.reduce((n, line) => n + line.quantity, 0);
  const mock = process.env.NEXT_PUBLIC_USE_MOCKS === "1";
  const demo = mock || process.env.NEXT_PUBLIC_DEMO === "1";
  const demoDescription = mock
    ? "Demo: sample products and illustrative images"
    : "Demo: cached backend results";
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={`${styles.inner} page-width`}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo} aria-label="spott. home">
              <Image
                src="/brand/wordmark.png"
                alt="spott."
                width={2172}
                height={724}
                priority
                sizes="(max-width: 600px) 108px, 140px"
              />
            </Link>
            {demo && (
              <span
                className={styles.demo}
                title={demoDescription}
                aria-label={demoDescription}
              >
                Demo
              </span>
            )}
          </div>
          <nav className={styles.nav} aria-label="Main navigation">
            <Link href="/" aria-current={path === "/" ? "page" : undefined}>
              Find your look
            </Link>
            <Link
              href="/#how-it-works"
              className={extraction ? styles.howLink : undefined}
            >
              How it works
            </Link>
            {extraction && (
              <Link
                href="/results"
                aria-current={path === "/results" ? "page" : undefined}
              >
                Your matches
              </Link>
            )}
          </nav>
          <button
            className={styles.bag}
            onClick={() => setCartOpen(true)}
            aria-label={`Open shopping bag, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <Icon name="bag" size={21} />
            {count > 0 && (
              <span key={count} className={styles.bagCount}>
                {count}
              </span>
            )}
          </button>
        </div>
      </header>
      <div key={path} className={path === "/" ? undefined : styles.pageEnter}>
        {children}
      </div>
      <footer className={styles.footer}>
        <div className={`${styles.footerInner} page-width`}>
          <Link href="/" className={styles.footerLogo} aria-label="spott. home">
            <Image
              src="/brand/wordmark.png"
              alt="spott."
              width={2172}
              height={724}
              sizes="100px"
            />
          </Link>
          <span>
            {demo
              ? `${mock ? "Sample products" : "Cached results"} · Demo experience`
              : "Spotted it? Shop it."}
          </span>
        </div>
      </footer>
      <CartDrawer />
    </>
  );
}
