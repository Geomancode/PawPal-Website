"use client";

import Link from "next/link";
import { Smartphone, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/ui";
import { buttonClassName } from "./Button";

type AppDeepLinkButtonProps = {
  href: string;
  fallbackHref?: string;
  children?: React.ReactNode;
  className?: string;
  fallbackLabel?: string;
};

export default function AppDeepLinkButton({
  href,
  fallbackHref = "/",
  children = "Open in App",
  className,
  fallbackLabel = "Continue on web",
}: AppDeepLinkButtonProps) {
  const [showFallback, setShowFallback] = useState(false);

  return (
    <div className="grid gap-2">
      <a
        href={href}
        onClick={() => {
          window.setTimeout(() => setShowFallback(true), 900);
        }}
        className={cn(buttonClassName({ size: "lg" }), className)}
      >
        <Smartphone className="h-4 w-4" aria-hidden="true" />
        {children}
      </a>
      {showFallback && (
        <div className="rounded-paw-sm border border-paw-border bg-paw-panel-subtle px-3 py-2 text-xs leading-5 text-paw-body">
          If the app did not open, keep browsing here or install PawPal first.
          <Link
            href={fallbackHref}
            className="mt-2 inline-flex items-center gap-1 font-extrabold text-paw-primary hover:text-paw-primary-hover"
          >
            {fallbackLabel}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}
