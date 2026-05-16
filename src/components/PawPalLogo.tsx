/**
 * PawPal Brand Logo Component
 *
 * Renders the official Tracker icon + handlettered wordmark from the brand system.
 * Supports both light and dark background variants.
 */

interface PawPalLogoProps {
  /** Size of the Tracker icon in pixels (default: 32) */
  iconSize?: number;
  /** Font size of the wordmark in pixels (default: 22) */
  fontSize?: number;
  /** Use the dark-background variant (white route path) */
  variant?: "light" | "dark";
  /** Additional CSS classes */
  className?: string;
  /** Hide the wordmark, show icon only */
  iconOnly?: boolean;
}

export default function PawPalLogo({
  iconSize = 32,
  fontSize = 22,
  variant = "light",
  className = "",
  iconOnly = false,
}: PawPalLogoProps) {
  const isLight = variant === "light";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Tracker Icon */}
      <svg
        viewBox="0 0 500 500"
        width={iconSize}
        height={iconSize}
        aria-hidden="true"
      >
        <path
          d="M 160 380 V 160 A 80 80 0 0 1 240 80 H 260 A 80 80 0 0 1 340 160 V 200 A 80 80 0 0 1 260 280 H 160"
          fill="none"
          stroke={isLight ? "#4A90D9" : "#FFFFFF"}
          strokeWidth="50"
          strokeLinecap="round"
        />
        <circle cx="160" cy="280" r="25" fill="#F59E0B" />
        <circle
          cx="160"
          cy="380"
          r="25"
          fill={isLight ? "#2D3748" : "rgba(255,255,255,0.4)"}
        />
      </svg>

      {/* Wordmark */}
      {!iconOnly && (
        <span
          className="font-brand font-extrabold tracking-tight leading-none"
          style={{ fontSize }}
        >
          <span style={{ color: isLight ? "#2D3748" : "#FFFFFF" }}>Paw</span>
          <span style={{ color: "#F59E0B" }}>Pal</span>
        </span>
      )}
    </span>
  );
}
