"use client";

import type { Product } from "./storeData";
import { cn } from "@/lib/ui";

type ProductVisualProps = {
  product: Product;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "h-12 w-12 text-2xl",
  md: "h-16 w-16 text-3xl",
  lg: "h-40 w-40 text-7xl",
  xl: "h-72 w-full max-w-xl text-8xl",
};

type ProductImageHint = {
  src: string;
  fit?: Product["imageFit"];
};

function productKey(product: Product) {
  return [
    product.slug,
    product.sku,
    product.name,
    product.description,
    product.tags?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function inferredProductImage(product: Product): ProductImageHint | null {
  const key = productKey(product);

  if (
    key.includes("smart tag") ||
    key.includes("smart id") ||
    key.includes("nfc") ||
    key.includes("qr") ||
    key.includes("pawpal tag")
  ) {
    return {
      src: key.includes("silver")
        ? "/assets/store-products/current/smart-tag/silver.webp"
        : "/assets/store-products/current/smart-tag/yellow.webp",
      fit: "contain",
    };
  }

  if (key.includes("water") && (key.includes("bottle") || key.includes("feeder"))) {
    return {
      src: "/assets/store-products/current/water-bottle/hero.webp",
      fit: "contain",
    };
  }

  if (key.includes("poop") || key.includes("scooper") || key.includes("picker")) {
    return {
      src: "/assets/store-products/current/poop-scooper/hero.webp",
      fit: "contain",
    };
  }

  if (key.includes("waste") || key.includes("bag")) {
    return {
      src: "/assets/store-products/current/waste-bags/roll-closeup.webp",
      fit: "contain",
    };
  }

  return null;
}

export default function ProductVisual({
  product,
  size = "md",
  className,
}: ProductVisualProps) {
  const imageHint = inferredProductImage(product);
  const imageUrl = product.imageUrl ?? imageHint?.src;
  const imageFit = product.imageFit ?? imageHint?.fit ?? "contain";
  const boxClassName = cn(
    "relative flex shrink-0 items-center justify-center overflow-hidden rounded-paw-sm bg-paw-panel",
    sizeClasses[size],
    className,
  );

  if (imageUrl) {
    const safeImageUrl = imageUrl.replace(/"/g, '\\"');
    return (
      <span className={boxClassName} role="img" aria-label={product.name}>
        <span
          className={cn(
            "absolute inset-0 bg-center bg-no-repeat",
            imageFit === "cover" ? "bg-cover" : "bg-contain",
          )}
          style={{ backgroundImage: `url("${safeImageUrl}")` }}
        />
      </span>
    );
  }

  return (
    <span className={boxClassName} aria-hidden="true">
      <span className="drop-shadow-sm">{product.image}</span>
    </span>
  );
}
