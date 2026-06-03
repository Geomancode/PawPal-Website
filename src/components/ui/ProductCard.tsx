import type { ReactNode } from "react";
import { Star } from "lucide-react";
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
    <Card className={cn("group overflow-hidden", className)}>
      <div className="relative flex aspect-[4/3] items-center justify-center bg-paw-primary-soft p-6">
        {badge && (
          <Badge tone={badgeTone} className="absolute left-4 top-4">
            {badge}
          </Badge>
        )}
        <div className="transition duration-200 group-hover:scale-[1.03]">
          {image}
        </div>
      </div>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-extrabold leading-6 text-paw-ink">
              {name}
            </h3>
            <div className="shrink-0 text-right">
              <span className="block text-base font-extrabold text-paw-primary">
                {price}
              </span>
              {originalPrice && (
                <span className="block text-xs font-bold text-paw-muted line-through">
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
        <div className="flex items-center justify-between gap-3">
          {typeof rating === "number" ? (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-paw-warning">
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
          <div className="flex items-center gap-2">
            {onDetails && (
              <Button type="button" variant="secondary" size="sm" onClick={onDetails}>
                {detailsLabel}
              </Button>
            )}
            <Button type="button" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
