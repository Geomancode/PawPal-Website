import { Radio } from "lucide-react";

export default function Loading() {
  return (
    <div className="deep-page-shell flex min-h-[100dvh] items-center justify-center bg-paw-page px-5 text-paw-ink">
      <div className="loading-panel">
        <div className="loading-panel-mark">
          <Radio className="h-6 w-6 animate-pulse" aria-hidden="true" />
        </div>
        <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-paw-primary">
          PawPal is loading
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-paw-primary-soft">
          <div className="globe-loading-bar h-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
