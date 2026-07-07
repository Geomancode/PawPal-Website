import type { ReactNode } from "react";
import { Info, ShoppingBag, Star } from "lucide-react";
import { cn } from "@/lib/ui";
import Badge from "./Badge";
import Button from "./Button";
import { Card, CardContent } from "./Card";

type ProductCardProps = {
  name: string;
  description?: string;
  price: string;
  originalPrice?: string;
  image: ReactNode;
  badge?: string;
  badgeTone?: "primary" | "accent" | "success" | "warning" | "neutral";
  rating?: number;
  ratingDetail?: string;
  actionLabel?: string;
  onAction?: () => void;
  detailsLabel?: string;
  onDetails?: () => void;
  className?: string;
};

export default function ProductCard({
  name,
  description,
  price,
  originalPrice,
  image,
  badge,
  badgeTone = "accent",
  rating,
  ratingDetail,
  actionLabel = "Add to cart",
  onAction,
  detailsLabel = "Details",
  onDetails,
  className,
}: ProductCardProps) {
  return (
    <Card
      className={cn(
        "group overflow-hidden transition-[border-color,box-shadow,transform] duration-paw-fast hover:-translate-y-1 hover:border-paw-primary/30 hover:shadow-paw-floating",
        className,
      )}
    >
      <div className="store-product-media relative flex aspect-[4/3] items-center justify-center p-paw-xl">
        {badge && (
          <Badge tone={badgeTone} className="absolute left-paw-md top-paw-md z-20">
            {badge}
          </Badge>
        )}
        <div className="relative z-10 transition duration-paw-fast group-hover:scale-[1.04]">
          {image}
        </div>
      </div>
      <CardContent className="space-y-paw-md">
        <div>
          <div className="flex items-start justify-between gap-paw-sm">
            <h3 className="min-w-0 text-base font-extrabold leading-6 text-paw-ink">
              {name}
            </h3>
            <div className="shrink-0 text-right">
              <span className="inline-flex rounded-paw-pill bg-paw-primary-soft px-paw-sm py-paw-xs text-sm font-black leading-none text-paw-on-primary-soft">
                {price}
              </span>
              {originalPrice && (
                <span className="mt-1 block text-xs font-bold text-paw-muted line-through">
                  {originalPrice}
                </span>
              )}
            </div>
          </div>
          {description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-paw-body">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-paw-sm">
          {typeof rating === "number" ? (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-paw-on-warning-soft">
              <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              {rating.toFixed(1)}
              {ratingDetail && (
                <span className="font-semibold text-paw-muted">
                  {ratingDetail}
                </span>
              )}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-paw-xs">
            {onDetails && (
              <Button type="button" variant="secondary" size="sm" onClick={onDetails}>
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                {detailsLabel}
              </Button>
            )}
            <Button type="button" size="sm" onClick={onAction}>
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
              {actionLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
