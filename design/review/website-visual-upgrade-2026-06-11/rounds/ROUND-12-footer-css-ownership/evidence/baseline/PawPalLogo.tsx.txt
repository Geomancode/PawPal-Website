/**
 * PawPal Brand Logo Component
 *
 * Renders the official solid-P icon + wordmark from the brand system.
 * Supports the light white-background and dark Paw Blue-background variants.
 */

import Image from "next/image";

interface PawPalLogoProps {
  /** Size of the logo badge in pixels (default: 32) */
  iconSize?: number;
  /** Font size of the wordmark in pixels (default: 22) */
  fontSize?: number;
  /** Use the white-background or Paw Blue-background variant */
  variant?: "light" | "dark";
  /** Additional CSS classes */
  className?: string;
  /** Hide the wordmark, show icon only */
  iconOnly?: boolean;
}

const LOGO_SRC = {
  light: "/assets/logos/pawpal-logo-light.svg",
  dark: "/assets/logos/pawpal-logo-dark.svg",
} as const;

export default function PawPalLogo({
  iconSize = 32,
  fontSize = 22,
  variant = "light",
  className = "",
  iconOnly = false,
}: PawPalLogoProps) {
  const isLight = variant === "light";
  const iconSrc = LOGO_SRC[variant];

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src={iconSrc}
        alt=""
        width={iconSize}
        height={iconSize}
        aria-hidden="true"
        draggable={false}
        loading="eager"
        className="block shrink-0"
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: "22%",
          boxShadow: isLight
            ? "0 1px 4px rgba(27, 45, 64, 0.08)"
            : "0 2px 8px rgba(74, 144, 217, 0.22)",
          outline: isLight ? "1px solid rgba(215, 231, 228, 0.82)" : undefined,
        }}
      />

      {/* Wordmark */}
      {!iconOnly && (
        <span
          className="font-brand font-extrabold tracking-tight leading-none"
          style={{ fontSize }}
        >
          <span style={{ color: isLight ? "var(--color-paw-brown)" : "#FFFFFF" }}>Paw</span>
          <span style={{ color: isLight ? "var(--color-paw-accent)" : "#FFCD38" }}>Pal</span>
        </span>
      )}
    </span>
  );
}
