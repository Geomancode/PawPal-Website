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
    <div className="legal-page-shell min-h-screen bg-paw-page pt-28 pb-16 text-paw-ink">
      <section className="mx-auto max-w-6xl px-4">
        <div className="legal-hero-panel">
          <div>
            <div className="inline-flex items-center gap-2 rounded-paw-md border border-paw-primary/20 bg-white/80 px-3 py-1.5 text-sm font-extrabold text-paw-primary shadow-sm">
              <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
              Community Guidelines
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
              Safer community spaces for pets and people.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-paw-body sm:text-lg">
              These guidelines explain what is expected when using PawPal
              community features, public pet safety flows, and in-app content.
            </p>
          </div>

          <aside className="legal-trust-panel">
            {[
              { icon: ShieldCheck, label: "Respect first", value: "Harassment, threats, and hate speech are not allowed." },
              { icon: Flag, label: "Report controls", value: "Every in-app content item includes a way to report concerns." },
              { icon: Scale, label: "Moderation actions", value: "Violations can lead to removal, suspension, or account bans." },
            ].map((item) => (
              <div key={item.label} className="legal-trust-row">
                <item.icon className="h-4 w-4 text-paw-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-extrabold text-paw-ink">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-paw-body">{item.value}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>

        <nav className="legal-section-nav mt-6" aria-label="Community guideline sections">
          {GUIDELINES_SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GUIDELINES_SECTIONS.map((section) => (
            <article
              key={section.title}
              id={section.id}
              className="legal-info-card rounded-paw-lg border border-paw-border bg-paw-panel p-5 shadow-paw-panel"
            >
              <div className="legal-info-icon">
                <section.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-extrabold text-paw-ink">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-paw-body">{section.text}</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-paw-primary">
                {section.signal}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
