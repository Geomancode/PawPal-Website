import {
  CheckCircle2,
  FileText,
  Handshake,
  MessageSquareWarning,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  PageShell,
  buttonClassName,
} from "@/components/ui";

const TERMS = [
  {
    id: "terms-responsible-use",
    icon: Handshake,
    title: "Use PawPal responsibly",
    text: "PawPal helps pet owners coordinate care, walks, safety, and community help. Do not misuse profiles, tags, maps, or community tools.",
    signal: "Community trust",
  },
  {
    id: "terms-store",
    icon: ShoppingBag,
    title: "Store purchases",
    text: "Store checkout is processed through Stripe. Product availability, pricing, and shipping details may change before an order is completed.",
    signal: "Stripe checkout",
  },
  {
    id: "terms-community",
    icon: MessageSquareWarning,
    title: "Community content",
    text: "Posts, chats, reports, and public rescue information should be accurate, respectful, and safe for other owners and finders.",
    signal: "Public safety",
  },
];

export default function TermsPage() {
  return (
    <PageShell className="pt-28 sm:pt-32" contentClassName="space-y-paw-xl">
      <Card className="overflow-hidden p-paw-xl sm:p-paw-xxl">
        <div className="grid gap-paw-xl lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
          <div>
            <Badge tone="primary" className="mb-paw-lg">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Legal
            </Badge>
            <h1 className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
              Clear rules for pet care, commerce, and community.
            </h1>
            <p className="mt-paw-md max-w-2xl text-paw-type-body text-paw-body sm:text-base">
              These terms summarize the expected use of PawPal across the
              website, store, app, and public pet safety flows.
            </p>
          </div>

          <aside className="grid gap-paw-sm">
            {[
              { icon: ShieldCheck, label: "Safety first", value: "Urgent rescue situations should use local services first." },
              { icon: ReceiptText, label: "Purchase clarity", value: "Checkout, pricing, and shipping are confirmed before payment." },
              { icon: CheckCircle2, label: "Respectful use", value: "Profiles, maps, and posts should help owners and finders." },
            ].map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-paw-sm rounded-paw-card border border-paw-outline-variant bg-paw-panel-subtle p-paw-sm"
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
      </Card>

      <nav className="flex flex-wrap gap-paw-sm" aria-label="Terms sections">
        {TERMS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            {section.title}
          </a>
        ))}
      </nav>

      <div className="grid gap-paw-md md:grid-cols-3">
        {TERMS.map((section) => (
          <Card key={section.title} id={section.id} className="scroll-mt-28 transition hover:-translate-y-1 hover:border-paw-primary/30 hover:shadow-paw-floating">
            <CardContent>
              <div className="mb-paw-md flex h-11 w-11 items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
                <section.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-paw-type-h2 font-black text-paw-ink">
                {section.title}
              </h2>
              <p className="mt-paw-sm text-sm leading-6 text-paw-body">{section.text}</p>
              <p className="mt-paw-md text-xs font-black uppercase text-paw-on-primary-soft">
                {section.signal}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
