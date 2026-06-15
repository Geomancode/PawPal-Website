import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  ScanLine,
  ShieldCheck,
  Siren,
  ShoppingBag,
  UserRound,
} from "lucide-react";

const SUPPORT_LANES = [
  {
    icon: ScanLine,
    title: "NFC tag or pet profile",
    route: "Finder page, QR/NFC, lost mode",
    text: "If a scan does not open the expected pet profile, include the tag ID and whether the owner has shared contact details.",
    action: "Shop or replace a tag",
    href: "/store",
  },
  {
    icon: ShoppingBag,
    title: "Store or order help",
    route: "Smart tags, checkout, order status",
    text: "For store questions, include the order email, product name, and the checkout or success screen you saw.",
    action: "View store",
    href: "/store",
  },
  {
    icon: UserRound,
    title: "Account and community",
    route: "Login, posts, chat, moderation",
    text: "For sign-in, posting, chat, or moderation questions, include your account email and the affected screen.",
    action: "Email support",
    href: "mailto:hello@pawpal.be",
  },
  {
    icon: Siren,
    title: "Safety or urgent pet issue",
    route: "Owner alerts, nearby help, rescue",
    text: "For urgent rescue or safety situations, contact local services first, then use PawPal to notify the owner or community.",
    action: "Open Globe",
    href: "/globe",
  },
];

const RESPONSE_STEPS = [
  { label: "Tag scan", value: "Tag ID + owner state", icon: ScanLine },
  { label: "Store", value: "Order email + product", icon: ShoppingBag },
  { label: "Account", value: "Email + affected screen", icon: MessageCircle },
  { label: "Urgent", value: "Local services first", icon: ShieldCheck },
];

export default function HelpPage() {
  return (
    <div className="deep-page-shell min-h-screen bg-paw-page pt-28 pb-16 text-paw-ink">
      <section className="support-hero mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-paw-md border border-paw-primary/20 bg-paw-panel/80 px-3 py-1.5 text-sm font-extrabold text-paw-primary shadow-sm">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Support
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Find the right PawPal help path.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-paw-body sm:text-lg">
            Choose a lane for tag scans, store orders, account access, community
            activity, or urgent pet safety.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="mailto:hello@pawpal.be"
              className="inline-flex items-center gap-2 rounded-paw-md bg-paw-primary px-5 py-3 text-sm font-bold text-white shadow-paw-action transition hover:bg-paw-primary-hover"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Contact support
            </a>
            <Link
              href="/globe"
              className="inline-flex items-center gap-2 rounded-paw-md border border-paw-border bg-paw-panel px-5 py-3 text-sm font-bold text-paw-ink transition hover:border-paw-primary/40 hover:bg-paw-primary-soft"
            >
              Open Globe
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <aside className="support-route-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-paw-muted">
                Support route
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-paw-ink">
                Pick the right lane
              </h2>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-paw-md bg-paw-primary-soft text-paw-primary">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {RESPONSE_STEPS.map((step) => (
              <div key={step.label} className="support-route-step">
                <step.icon className="h-4 w-4 text-paw-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-paw-muted">
                    {step.label}
                  </p>
                  <p className="truncate text-sm font-extrabold text-paw-ink">
                    {step.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SUPPORT_LANES.map((item) => (
            <article
              key={item.title}
              className="support-card rounded-paw-lg border border-paw-border bg-paw-panel p-5 shadow-paw-panel"
            >
              <div className="support-card-icon">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-extrabold text-paw-ink">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-paw-body">{item.text}</p>
              <p className="mt-4 text-xs font-bold text-paw-muted">{item.route}</p>
              <a
                href={item.href}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-paw-primary transition hover:text-paw-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw-primary"
              >
                {item.action}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>

        <div className="support-contact-band mt-8">
          <div>
            <p className="text-sm font-extrabold text-paw-ink">
              Include only the context that helps support route the issue.
            </p>
            <p className="mt-1 text-sm leading-6 text-paw-body">
              Tag ID, account email, order email, product name, affected screen,
              and screenshots are enough for most requests.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-paw-primary">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Belgium-first support
          </div>
        </div>
      </section>
    </div>
  );
}
