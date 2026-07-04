/**
 * PawPal Brand Logo Component
 *
 * Renders the approved PawPal transparent SVG assets.
 * Full logo usage must come from the horizontal lockup, not a recreated wordmark.
 */

import Image from "next/image";

interface PawPalLogoProps {
  /** Height of the full logo or size of the icon-only mark in pixels (default: 32) */
  iconSize?: number;
  /** Legacy sizing hint kept for existing call sites */
  fontSize?: number;
  /** Use the light-mode asset, dark-mode asset, or adaptive asset */
  variant?: "light" | "dark" | "adaptive";
  /** Additional CSS classes */
  className?: string;
  /** Show the mark only */
  iconOnly?: boolean;
}

const MARK_SRC = {
  light: "/assets/logos/pawpal-logo-light.svg",
  dark: "/assets/logos/pawpal-logo-dark.svg",
} as const;

const HORIZONTAL_SRC = {
  light: "/pawpal_logo_horizontal.svg",
  dark: "/pawpal_logo_horizontal_dark.svg",
} as const;

const HORIZONTAL_LOGO_RATIO = 520 / 140;

export default function PawPalLogo({
  iconSize = 32,
  fontSize = 22,
  variant = "light",
  className = "",
  iconOnly = false,
}: PawPalLogoProps) {
  const logoHeight = iconOnly ? iconSize : Math.max(iconSize, Math.round(fontSize * 1.45));
  const logoWidth = iconOnly ? iconSize : Math.round(logoHeight * HORIZONTAL_LOGO_RATIO);
  const source = iconOnly ? MARK_SRC : HORIZONTAL_SRC;
  const logoStyle = {
    width: logoWidth,
    height: logoHeight,
  };
  const renderLogo = (mode: keyof typeof source, adaptiveClass = "") => (
    <Image
      src={source[mode]}
      alt=""
      width={logoWidth}
      height={logoHeight}
      aria-hidden="true"
      draggable={false}
      loading="eager"
      className={`shrink-0 ${adaptiveClass}`}
      style={logoStyle}
    />
  );

  return (
    <span
      className={`inline-flex items-center ${className}`}
      role={iconOnly ? undefined : "img"}
      aria-label={iconOnly ? undefined : "PawPal"}
    >
      {variant === "adaptive" ? (
        <>
          {renderLogo("light", "pawpal-logo-light")}
          {renderLogo("dark", "pawpal-logo-dark")}
        </>
      ) : (
        renderLogo(variant)
      )}
    </span>
  );
}
