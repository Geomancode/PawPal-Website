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
import {
  Badge,
  Card,
  CardContent,
  PageShell,
  buttonClassName,
} from "@/components/ui";

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
    <PageShell className="pt-28 sm:pt-32" contentClassName="space-y-paw-xl">
      <section className="grid gap-paw-xl lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
        <Card variant="hero" className="p-paw-xl sm:p-paw-xxl">
          <Badge tone="primary" variant="semantic" className="mb-paw-lg">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Support
          </Badge>
          <h1 className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
            Find the right PawPal help path.
          </h1>
          <p className="mt-paw-md max-w-2xl text-paw-type-body text-paw-body sm:text-base">
            Choose a lane for tag scans, store orders, account access, community
            activity, or urgent pet safety.
          </p>
          <div className="mt-paw-xl flex flex-wrap gap-paw-sm">
            <a
              href="mailto:hello@pawpal.be"
              className={buttonClassName({ size: "lg" })}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Contact support
            </a>
            <Link
              href="/globe"
              className={buttonClassName({ variant: "secondary", size: "lg" })}
            >
              Open Globe
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card variant="panel" className="p-paw-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-paw-type-caption font-black uppercase text-paw-muted">
                Support route
              </p>
              <h2 className="mt-paw-xs text-paw-type-h2 font-black text-paw-ink">
                Pick the right lane
              </h2>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-paw-lg grid gap-paw-sm sm:grid-cols-2 lg:grid-cols-1">
            {RESPONSE_STEPS.map((step) => (
              <div
                key={step.label}
                className="flex items-center gap-paw-sm rounded-paw-card border border-paw-outline-variant bg-paw-panel-subtle p-paw-sm"
              >
                <step.icon className="h-4 w-4 text-paw-on-primary-soft" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-paw-muted">
                    {step.label}
                  </p>
                  <p className="truncate text-sm font-extrabold text-paw-ink">
                    {step.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <div className="grid gap-paw-md md:grid-cols-2 xl:grid-cols-4">
          {SUPPORT_LANES.map((item) => (
            <Card
              key={item.title}
              variant="panel"
              className="h-full transition hover:-translate-y-1 hover:border-paw-primary/30 hover:shadow-paw-floating"
            >
              <CardContent className="flex h-full flex-col">
                <div className="mb-paw-md flex h-11 w-11 items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="text-paw-type-h3 font-black text-paw-ink">
                  {item.title}
                </h2>
                <p className="mt-paw-sm text-sm leading-6 text-paw-body">{item.text}</p>
                <p className="mt-paw-md text-xs font-bold text-paw-muted">{item.route}</p>
                <a
                  href={item.href}
                  className="mt-auto inline-flex items-center gap-paw-xs pt-paw-md text-sm font-extrabold text-paw-on-primary-soft transition hover:text-paw-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                >
                  {item.action}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card variant="compact" className="mt-paw-xl p-paw-lg">
          <div className="flex flex-col justify-between gap-paw-md sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-extrabold text-paw-ink">
              Include only the context that helps support route the issue.
            </p>
            <p className="mt-1 text-sm leading-6 text-paw-body">
              Tag ID, account email, order email, product name, affected screen,
              and screenshots are enough for most requests.
            </p>
          </div>
          <div className="flex items-center gap-paw-xs text-sm font-bold text-paw-on-primary-soft">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Belgium-first support
          </div>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
