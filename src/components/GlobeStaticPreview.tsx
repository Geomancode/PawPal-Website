import { MapPin, Radio, Route, ShieldCheck } from "lucide-react";

interface GlobeStaticPreviewProps {
  className?: string;
  statusLabel?: string;
  pulseStatus?: boolean;
}

export default function GlobeStaticPreview({
  className = "",
  statusLabel = "Loading live globe",
  pulseStatus = true,
}: GlobeStaticPreviewProps) {
  return (
    <div
      className={`globe-static-preview ${className}`.trim()}
      role="img"
      aria-label="PawPal map preview with route, safety, and nearby help signals"
    >
      <div className="globe-static-preview-grid" aria-hidden="true" />
      <div className="globe-static-preview-earth" aria-hidden="true">
        <span className="globe-static-preview-orbit" />
        <span className="globe-static-preview-route" />
        <span className="globe-static-preview-pin globe-static-preview-pin-a" />
        <span className="globe-static-preview-pin globe-static-preview-pin-b" />
        <span className="globe-static-preview-pin globe-static-preview-pin-c" />
      </div>
      <div className="globe-static-preview-card left-2 top-8 sm:left-4">
        <MapPin className="h-4 w-4 text-paw-primary" aria-hidden="true" />
        <span>Ghent pilot</span>
      </div>
      <div className="globe-static-preview-card bottom-14 right-0 sm:right-3">
        <ShieldCheck className="h-4 w-4 text-paw-trust" aria-hidden="true" />
        <span>NFC finder ready</span>
      </div>
      <div className="globe-static-preview-card bottom-4 left-8">
        <Route className="h-4 w-4 text-paw-accent" aria-hidden="true" />
        <span>2.43 km revealed</span>
      </div>
      <div className="globe-static-preview-loading">
        <Radio className={`h-4 w-4 ${pulseStatus ? "animate-pulse" : ""}`.trim()} aria-hidden="true" />
        {statusLabel}
      </div>
    </div>
  );
}
