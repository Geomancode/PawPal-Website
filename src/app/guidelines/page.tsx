import {
  Ban,
  EyeOff,
  Flag,
  Handshake,
  Mail,
  MessageSquareWarning,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { siteConfig } from "@/lib/site";
import {
  Badge,
  Card,
  CardContent,
  PageShell,
  buttonClassName,
} from "@/components/ui";

const GUIDELINES_SECTIONS = [
  {
    id: "guidelines-respect",
    icon: Handshake,
    title: "Respect every member",
    text: "Treat pet owners, finders, partners, and neighbors with respect. Harassment, bullying, threats, hate speech, or attacks based on identity or protected traits are not allowed.",
    signal: "No harassment",
  },
  {
    id: "guidelines-prohibited-content",
    icon: Ban,
    title: "Prohibited content",
    text: "Do not post violent threats, graphic violence, sexual content, animal abuse, illegal trades, scams, spam, or repetitive marketing that disrupts the community.",
    signal: "Content safety",
  },
  {
    id: "guidelines-location-privacy",
    icon: EyeOff,
    title: "Location and privacy",
    text: "Do not publish another person's home-level location, private address, exact routine, contact details, or pet identity information without consent.",
    signal: "Private by default",
  },
  {
    id: "guidelines-reporting",
    icon: Flag,
    title: "Reports and moderation",
    text: "Each in-app content item includes a report control. PawPal reviews reports and may remove content, limit features, suspend accounts, or ban accounts after violations.",
    signal: "Report in app",
  },
  {
    id: "guidelines-appeals",
    icon: Mail,
    title: "Appeals",
    text: `If you believe a moderation action was made in error, contact ${siteConfig.email} with your account email, the affected content, and any relevant context.`,
    signal: "Support review",
  },
];

export default function GuidelinesPage() {
  return (
    <PageShell className="pt-28 sm:pt-32" contentClassName="space-y-paw-xl">
      <Card className="overflow-hidden p-paw-xl sm:p-paw-xxl">
        <div className="grid gap-paw-xl lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
          <div>
            <Badge tone="primary" className="mb-paw-lg">
              <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
              Community Guidelines
            </Badge>
            <h1 className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
              Safer community spaces for pets and people.
            </h1>
            <p className="mt-paw-md max-w-2xl text-paw-type-body text-paw-body sm:text-base">
              These guidelines explain what is expected when using PawPal
              community features, public pet safety flows, and in-app content.
            </p>
          </div>

          <aside className="grid gap-paw-sm">
            {[
              { icon: ShieldCheck, label: "Respect first", value: "Harassment, threats, and hate speech are not allowed." },
              { icon: Flag, label: "Report controls", value: "Every in-app content item includes a way to report concerns." },
              { icon: Scale, label: "Moderation actions", value: "Violations can lead to removal, suspension, or account bans." },
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

      <nav className="flex flex-wrap gap-paw-sm" aria-label="Community guideline sections">
        {GUIDELINES_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            {section.title}
          </a>
        ))}
      </nav>

      <div className="grid gap-paw-md md:grid-cols-2 lg:grid-cols-3">
        {GUIDELINES_SECTIONS.map((section) => (
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
