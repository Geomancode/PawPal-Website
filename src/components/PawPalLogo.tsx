/**
 * PawPal Brand Logo Component
 *
 * Renders the official solid-P icon + wordmark from the brand system.
 * Supports the light white-background, dark Paw Blue-background, and adaptive variants.
 */

import Image from "next/image";

interface PawPalLogoProps {
  /** Size of the logo badge in pixels (default: 32) */
  iconSize?: number;
  /** Font size of the wordmark in pixels (default: 22) */
  fontSize?: number;
  /** Use the white-background, Paw Blue-background, or color-scheme adaptive variant */
  variant?: "light" | "dark" | "adaptive";
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
  const isAdaptive = variant === "adaptive";
  const iconSrc = isAdaptive ? LOGO_SRC.light : LOGO_SRC[variant];

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
        className={isAdaptive ? "pawpal-logo-mark-light block shrink-0" : "block shrink-0"}
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: "22%",
          boxShadow: isLight || isAdaptive
            ? "0 1px 4px rgba(27, 45, 64, 0.08)"
            : "0 2px 8px rgba(74, 144, 217, 0.22)",
          outline: isLight || isAdaptive ? "1px solid rgba(215, 231, 228, 0.82)" : undefined,
        }}
      />
      {isAdaptive && (
        <Image
          src={LOGO_SRC.dark}
          alt=""
          width={iconSize}
          height={iconSize}
          aria-hidden="true"
          draggable={false}
          loading="eager"
          className="pawpal-logo-mark-dark hidden shrink-0"
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: "22%",
            boxShadow: "0 2px 8px rgba(74, 144, 217, 0.22)",
          }}
        />
      )}

      {/* Wordmark */}
      {!iconOnly && (
        <span
          className={isAdaptive ? "pawpal-logo-wordmark font-brand font-extrabold tracking-tight leading-none" : "font-brand font-extrabold tracking-tight leading-none"}
          style={{ fontSize }}
        >
          <span style={{ color: isAdaptive ? "var(--paw-logo-paw)" : isLight ? "var(--color-paw-brown)" : "#FFFFFF" }}>Paw</span>
          <span style={{ color: isAdaptive ? "var(--paw-logo-pal)" : isLight ? "var(--color-paw-accent)" : "#FFCD38" }}>Pal</span>
        </span>
      )}
    </span>
  );
}
