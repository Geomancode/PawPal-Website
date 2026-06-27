import { MapPin, Radio, Route, ShieldCheck } from "lucide-react";

interface GlobeStaticPreviewProps {
  className?: string;
  statusLabel?: string;
  pulseStatus?: boolean;
}

export default function GlobeStaticPreview({
  className = "",
  statusLabel = "Static map preview",
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
        <span>Demo center · Ghent</span>
      </div>
      <div className="globe-static-preview-card bottom-24 right-0 sm:right-3">
        <ShieldCheck className="h-4 w-4 text-paw-trust" aria-hidden="true" />
        <span>Finder flow preview</span>
      </div>
      <div className="globe-static-preview-card bottom-12 left-3 sm:left-8">
        <Route className="h-4 w-4 text-paw-accent" aria-hidden="true" />
        <span>Demo route line</span>
      </div>
      <div className="globe-static-preview-loading">
        <Radio className={`h-4 w-4 ${pulseStatus ? "animate-pulse" : ""}`.trim()} aria-hidden="true" />
        <span className="rounded-paw-sm border border-paw-primary/25 bg-paw-primary-soft px-2 py-1 text-[10px] font-black text-paw-primary">
          STATIC
        </span>
        {statusLabel}
      </div>
    </div>
  );
}
