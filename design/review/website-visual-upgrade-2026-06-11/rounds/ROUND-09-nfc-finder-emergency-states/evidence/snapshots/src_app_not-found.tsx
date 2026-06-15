import Link from "next/link";
import { ArrowRight, Home, Map, ScanLine } from "lucide-react";
import PawPalLogo from "@/components/PawPalLogo";

export default function NotFound() {
  return (
    <section className="deep-page-shell min-h-[100dvh] bg-paw-page px-5 py-28 text-paw-ink">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <PawPalLogo iconSize={44} fontSize={28} variant="light" />
          <p className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-paw-primary">
            Page not found
          </p>
          <h1 className="mt-3 max-w-xl font-brand text-4xl font-extrabold leading-tight text-paw-ink sm:text-6xl">
            This PawPal route is not available.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-paw-body">
            The link may be old, private, or missing a valid pet, post, group, or
            profile ID. Start from a trusted PawPal page instead.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-paw-sm bg-paw-primary px-5 text-sm font-extrabold text-white shadow-paw-action transition hover:bg-paw-primary-hover"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Back home
            </Link>
            <Link
              href="/store"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-paw-sm border border-paw-border-strong bg-paw-panel px-5 text-sm font-extrabold text-paw-ink transition hover:border-paw-primary hover:text-paw-primary"
            >
              Shop smart tags
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <aside className="not-found-panel">
          <div className="hero-map-grid absolute inset-0 opacity-35" aria-hidden="true" />
          <div className="relative z-10 space-y-4">
            {[
              {
                icon: ScanLine,
                title: "Scanned a tag?",
                copy: "Check the printed code and try the full NFC or QR link again.",
              },
              {
                icon: Map,
                title: "Looking for local help?",
                copy: "The live Globe keeps places, weather, and community needs close.",
              },
            ].map((item) => (
              <div key={item.title} className="not-found-row">
                <span className="not-found-icon">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-paw-ink">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-paw-body">
                    {item.copy}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
