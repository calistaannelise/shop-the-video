"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import styles from "./HowItWorks.module.css";

// Explanatory vector nodes only; never catalog data or live shopping controls.
function Garment({ kind }: { kind: "jacket" | "jeans" }) {
  return (
    <svg
      viewBox="0 0 48 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "jacket" ? (
        <>
          <path d="m16 9-8 4-6 20 7 3 5-13-1 25h22l-1-25 5 13 7-3-6-20-8-4-8 3-8-3Z" />
          <path d="m16 9 3 9 5-6 5 6 3-9M24 13v35" />
        </>
      ) : (
        <>
          <path d="M13 7h22l3 43H28l-4-28-4 28H10l3-43Z" />
          <path d="M13 12h22M24 8v10l-3 4" />
        </>
      )}
    </svg>
  );
}

function Connector() {
  return (
    <span className={styles.connector}>
      <Icon name="arrow" size={24} />
    </span>
  );
}

export default function HowItWorks() {
  const section = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      setRevealed([true, true, true]);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;
        setRevealed((current) =>
          current.map(
            (ready, index) =>
              ready || visible.some((entry) => entry.target === steps[index]),
          ),
        );
        visible.forEach((entry) => observer.unobserve(entry.target));
      },
      { threshold: 0.25, rootMargin: "0px 0px -16px 0px" },
    );
    const steps = Array.from(element.querySelectorAll("ol > li"));
    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, [replay]);

  return (
    <section
      ref={section}
      id="how-it-works"
      className={`${styles.section} page-width`}
      aria-labelledby="how-title"
    >
      <div className={styles.heading}>
        <h2 id="how-title">How it works</h2>
        <button
          type="button"
          className={styles.replay}
          aria-label="Replay the process animation"
          onClick={() => {
            setRevealed([true, true, true]);
            setReplay((count) => count + 1);
          }}
        >
          <Icon name="refresh" size={15} />
          Replay
        </button>
      </div>
      <ol key={replay} className={styles.steps}>
        <li data-revealed={revealed[0]}>
          <div className={styles.visual} aria-hidden="true">
            <Connector />
            <div className={styles.inputNode}>
              <span className={styles.imageFrame}>
                <Icon name="image" size={42} />
              </span>
              <span>Screenshot</span>
              <span className={styles.uploadBadge}>
                <Icon name="upload" size={19} />
              </span>
            </div>
          </div>
          <div className={styles.caption}>
            <div className={styles.stepHeading}>
              <span aria-hidden="true">01</span>
              <h3>Spot it</h3>
            </div>
            <p>Upload a screenshot of a look you love</p>
          </div>
        </li>
        <li data-revealed={revealed[1]}>
          <div className={styles.visual} aria-hidden="true">
            <Connector />
            <div className={styles.matchingNodes}>
              <div className={`${styles.itemNode} ${styles.highlightedItem}`}>
                <Garment kind="jacket" />
                <span>Jacket</span>
                <span className={styles.matchMark}>
                  <Icon name="check" size={12} />
                </span>
              </div>
              <div className={styles.itemNode}>
                <Garment kind="jeans" />
                <span>Jeans</span>
              </div>
            </div>
          </div>
          <div className={styles.caption}>
            <div className={styles.stepHeading}>
              <span aria-hidden="true">02</span>
              <h3>Find it</h3>
            </div>
            <p>Discover similar pieces across brands</p>
          </div>
        </li>
        <li data-revealed={revealed[2]}>
          <div className={styles.visual} aria-hidden="true">
            <div className={styles.outputNode}>
              <div>
                <Garment kind="jacket" />
                <span>Jacket</span>
                <span className={styles.selectionCheck}>
                  <Icon name="check" size={13} />
                </span>
              </div>
              <div>
                <Garment kind="jeans" />
                <span>Jeans</span>
                <span className={styles.selectionCheck}>
                  <Icon name="check" size={13} />
                </span>
              </div>
              <span className={styles.outputLabel}>
                Your look <Icon name="bag" size={15} />
              </span>
            </div>
          </div>
          <div className={styles.caption}>
            <div className={styles.stepHeading}>
              <span aria-hidden="true">03</span>
              <h3>Shop it</h3>
            </div>
            <p>Choose your favorites. Build your look</p>
          </div>
        </li>
      </ol>
    </section>
  );
}
