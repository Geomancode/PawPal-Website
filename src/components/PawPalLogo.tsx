/**
 * PawPal Brand Logo Component
 *
 * Renders the app-standard solid-P icon + PawPal wordmark.
 * The adaptive variant keeps the app's white logo tile on every surface.
 */

import Image from "next/image";

interface PawPalLogoProps {
  /** Size of the logo badge in pixels (default: 32) */
  iconSize?: number;
  /** Font size of the wordmark in pixels (default: 22) */
  fontSize?: number;
  /** Use the white-background, Paw Blue-background, or app-standard adaptive variant */
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
  const useLightMark = variant === "light" || variant === "adaptive";
  const iconSrc = useLightMark ? LOGO_SRC.light : LOGO_SRC.dark;

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
          boxShadow: useLightMark
            ? "0 1px 4px rgba(27, 45, 64, 0.08)"
            : "0 2px 8px rgba(74, 144, 217, 0.22)",
          outline: useLightMark ? "1px solid rgba(215, 231, 228, 0.82)" : undefined,
        }}
      />

      {/* Wordmark */}
      {!iconOnly && (
        <span
          className="pawpal-logo-wordmark font-bold leading-none tracking-normal"
          style={{
            color: variant === "dark" ? "#FFFFFF" : "var(--paw-logo-wordmark)",
            fontFamily: "var(--font-app-logo)",
            fontSize,
            letterSpacing: 0,
          }}
        >
          PawPal
        </span>
      )}
    </span>
  );
}
