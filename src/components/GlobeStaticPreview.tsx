import PawIcon from "@/components/icons/PawIcon";

interface GlobeStaticPreviewProps {
  ariaLabel?: string;
  className?: string;
  statusLabel?: string;
  pulseStatus?: boolean;
}

export default function GlobeStaticPreview({
  ariaLabel = "PawPal globe visual preview",
  className = "",
  statusLabel = "Visual preview · Loading live posts",
  pulseStatus = true,
}: GlobeStaticPreviewProps) {
  return (
    <div
      className={`globe-static-preview ${className}`.trim()}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="globe-static-preview-grid" aria-hidden="true" />
      <div className="globe-static-preview-earth" aria-hidden="true">
        <span className="globe-static-preview-orbit" />
        <span className="globe-static-preview-route" />
        <span className="globe-static-preview-marker globe-static-preview-marker-a" />
        <span className="globe-static-preview-marker globe-static-preview-marker-b" />
        <span className="globe-static-preview-marker globe-static-preview-marker-c" />
      </div>
      <div className="globe-static-preview-loading">
        <PawIcon name="live" className={`h-4 w-4 ${pulseStatus ? "animate-pulse" : ""}`.trim()} aria-hidden="true" />
        {statusLabel}
      </div>
    </div>
  );
}
