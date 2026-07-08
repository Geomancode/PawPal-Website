import {
  CheckCircle2,
  Cookie,
  Database,
  Eye,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Badge,
  PageShell,
  buttonClassName,
} from "@/components/ui";

type PrivacySection = {
  id: string;
  icon: LucideIcon;
  title: string;
  text: string;
  signal: string;
  items?: Array<{
    label: string;
    text: string;
  }>;
};

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "privacy-data",
    icon: Database,
    title: "Data we use",
    text: "PawPal uses account, pet profile, map, walk, store, and community data to provide the product features you choose to use.",
    signal: "Feature-scoped",
  },
  {
    id: "privacy-location",
    icon: MapPinned,
    title: "Location and safety",
    text: "Location features are used for maps, walks, nearby places, and safety workflows. Public finder pages only show the information owners choose to expose.",
    signal: "Controlled sharing",
  },
  {
    id: "privacy-choices",
    icon: SlidersHorizontal,
    title: "Your choices",
    text: "You can update account details, pet profile visibility, lost-mode settings, and communication preferences from the app or by contacting support.",
    signal: "Owner managed",
  },
  {
    id: "privacy-cookies",
    icon: Cookie,
    title: "Cookies & local storage",
    text: "PawPal currently does not run third-party analytics. Non-essential analytics must be gated by consent before loading.",
    signal: "Consent gated",
    items: [
      {
        label: "Auth",
        text: "Necessary Supabase authentication cookies keep sign-in sessions working.",
      },
      {
        label: "Checkout",
        text: "Necessary Stripe checkout storage supports payment and order flows.",
      },
      {
        label: "Preferences",
        text: "Local preferences remember choices such as globe tutorials and store state.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <PageShell className="legal-page-shell pt-28 sm:pt-32" contentClassName="space-y-paw-xl">
      <section className="legal-hero-panel">
        <div className="grid gap-paw-xl lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
          <div>
            <Badge tone="primary" className="mb-paw-lg">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Privacy
            </Badge>
            <h1 className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
              Controlled sharing for every pet safety flow.
            </h1>
            <p className="mt-paw-md max-w-2xl text-paw-type-body text-paw-body sm:text-base">
              PawPal is designed around controlled sharing: owners decide what
              is public, what stays private, and when lost-mode information
              should be visible.
            </p>
          </div>

          <aside className="grid gap-paw-sm">
            {[
              { icon: LockKeyhole, label: "Owner-selected sharing", value: "Public safety details are controlled by the owner." },
              { icon: Eye, label: "Finder pages", value: "Finder-visible details stay scoped to the rescue flow." },
              { icon: CheckCircle2, label: "Privacy requests", value: "Support can route account-data and privacy questions." },
            ].map((item) => (
              <div
                key={item.label}
                className="legal-trust-row"
              >
                <item.icon className="h-4 w-4 text-paw-on-primary-soft" aria-hidden="true" />
                <div>
                  <p className="text-sm font-extrabold text-paw-ink">{item.label}</p>
                  <p className="mt-paw-xxs text-xs leading-5 text-paw-body">{item.value}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <nav className="legal-section-nav" aria-label="Privacy sections">
        {PRIVACY_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            {section.title}
          </a>
        ))}
      </nav>

      <div className="legal-prose-grid">
        {PRIVACY_SECTIONS.map((section) => (
          <section key={section.title} id={section.id} className="legal-prose-section">
              <div className="legal-info-icon">
                <section.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-paw-type-h2 font-black text-paw-ink">
                {section.title}
              </h2>
              <p className="mt-paw-sm text-sm leading-6 text-paw-body">{section.text}</p>
              {section.items ? (
                <ul className="mt-paw-md space-y-paw-sm text-sm leading-6 text-paw-body">
                  {section.items.map((item) => (
                    <li key={item.label}>
                      <span className="font-extrabold text-paw-ink">
                        {item.label}:
                      </span>{" "}
                      {item.text}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-paw-md text-xs font-black uppercase text-paw-on-primary-soft">
                {section.signal}
              </p>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
