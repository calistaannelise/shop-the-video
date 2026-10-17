"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { extract } from "@/lib/api";
import { mockExtract } from "@/lib/mocks";
import { useStore } from "@/lib/store";
import Icon from "@/components/Icon";
import styles from "./home.module.css";
import HowItWorks from "@/components/HowItWorks";
import ScrollReveal from "@/components/ScrollReveal";

export default function UploadPage() {
  const router = useRouter();
  const { setExtraction, setInspiration, resetOutfit } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function onFile(next: File | undefined) {
    if (!next || busy.current) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      setError("That image is a little large. Please choose one under 10 MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(next);
      bitmap.close();
      setFile(next);
    } catch {
      setError("We couldn’t read that image. Please try another screenshot.");
    }
  }
  async function findLook() {
    if (!file || busy.current) {
      if (!file) input.current?.click();
      return;
    }
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await extract(file, caption.trim() || undefined);
      if (!response.items.length)
        throw new Error(
          "No clothing pieces found. Try a clearer outfit photo.",
        );
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject(new Error("Couldn’t load the screenshot preview."));
        reader.readAsDataURL(file);
      });
      setInspiration(dataUrl);
      setExtraction(response);
      resetOutfit();
      router.push("/results");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn’t find your look. Please try again.",
      );
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }
  return (
    <main id="main">
      <section
        className={`${styles.hero} page-width`}
        aria-labelledby="home-title"
      >
        <div className={styles.copy}>
          <h1 id="home-title">
            <span className={styles.headlineLine}>
              <span>Spotted a look</span>
            </span>
            <span className={styles.headlineLine}>
              <span>you love?</span>
            </span>
          </h1>
          <p className={styles.description}>
            Upload a screenshot. Find similar pieces. Make it yours.
          </p>
          <div
            id="upload"
            className={`${styles.upload} ${dragging ? styles.dragging : ""}`}
            aria-busy={loading}
            onDragOver={(e) => {
              e.preventDefault();
              if (!loading) setDragging(true);
            }}
            onDragLeave={(e) => {
              if (
                !(e.relatedTarget instanceof Node) ||
                !e.currentTarget.contains(e.relatedTarget)
              )
                setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void onFile(e.dataTransfer.files[0]);
            }}
          >
            <input
              ref={input}
              id="outfit-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Outfit screenshot"
              tabIndex={-1}
              className="sr-only"
              disabled={loading}
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {preview ? (
              <div className={styles.selectedUpload}>
                <div className={styles.preview}>
                  <Image
                    src={preview}
                    alt="Your selected outfit screenshot"
                    width={64}
                    height={80}
                    unoptimized
                  />
                  <div className={styles.fileDetails}>
                    <strong>{file?.name}</strong>
                    <span>Ready to find your look.</span>
                    <div className={styles.previewActions}>
                      <button
                        disabled={loading}
                        onClick={() => input.current?.click()}
                      >
                        Replace
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => {
                          setFile(null);
                          setError(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                <details className={styles.caption}>
                  <summary>
                    Add a brand or detail <span>(optional)</span>
                  </summary>
                  <label className="sr-only" htmlFor="caption">
                    Brand or outfit details
                  </label>
                  <input
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="A brand, a creator, a detail you love…"
                    disabled={loading}
                    maxLength={500}
                  />
                </details>
                <button
                  className={`button button-primary ${styles.findButton}`}
                  onClick={findLook}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" /> Finding your look…
                    </>
                  ) : (
                    "Find similar pieces"
                  )}
                </button>
              </div>
            ) : (
              <button
                className={styles.uploadTrigger}
                disabled={loading}
                onClick={() => input.current?.click()}
                aria-describedby="upload-help"
              >
                <Icon name="upload" size={25} />
                <strong>
                  {dragging
                    ? "Drop your screenshot here"
                    : "Upload a screenshot"}
                </strong>
                <span>or drag and drop your image here</span>
                <small id="upload-help">JPG, PNG or WebP · Up to 10 MB</small>
              </button>
            )}
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {process.env.NEXT_PUBLIC_USE_MOCKS === "1" && (
            <button
              className={styles.sampleLink}
              disabled={loading}
              onClick={() => {
                setInspiration("/images/everyday-style.jpg");
                setExtraction(mockExtract);
                resetOutfit();
                router.push("/results");
              }}
            >
              Try a sample look
            </button>
          )}
        </div>
        <ScrollReveal className={styles.photo}>
          <Image
            width={1200}
            height={1800}
            priority
            unoptimized
            src="/images/everyday-style.jpg"
            alt="Everyday outfit inspiration: a relaxed denim jacket, white knit top, and distressed jeans"
          />
        </ScrollReveal>
      </section>
      <HowItWorks />
    </main>
  );
}
