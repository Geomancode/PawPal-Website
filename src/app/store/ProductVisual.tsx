"use client";

import type { Product } from "./storeData";
import { cn } from "@/lib/ui";

type ProductVisualProps = {
  product: Product;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const frameClasses = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-40 w-40",
} as const;

export default function ProductVisual({
  product,
  size = "md",
  className,
}: ProductVisualProps) {
  const boxClassName = cn(
    "product-visual relative flex shrink-0 items-center justify-center overflow-hidden rounded-paw-sm bg-paw-panel",
    frameClasses[size],
    className,
  );

  if (product.imageUrl) {
    const safeImageUrl = product.imageUrl.replace(/"/g, '\\"');
    return (
      <span className={boxClassName} data-size={size} role="img" aria-label={product.name}>
        <span
          className={cn(
            "absolute inset-0 bg-center bg-no-repeat",
            product.imageFit === "contain" ? "bg-contain" : "bg-cover",
          )}
          style={{ backgroundImage: `url("${safeImageUrl}")` }}
        />
      </span>
    );
  }

  return (
    <span className={boxClassName} data-size={size} aria-hidden="true">
      <span className="product-visual-glyph drop-shadow-sm">{product.image}</span>
    </span>
  );
}
