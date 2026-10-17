"use client";
import { useState } from "react";
import Icon from "./Icon";
export default function ProductImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src)
    return (
      <div
        className={`image-fallback ${className}`}
        role="img"
        aria-label={`${alt}, image unavailable`}
      >
        <Icon name="image" size={30} />
        <span>Image unavailable</span>
      </div>
    );
  // Product image hosts come from the catalog; native images support arbitrary merchant domains.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
      loading="lazy"
    />
  );
}
