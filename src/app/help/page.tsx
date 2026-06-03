import { Mail, MapPin, MessageCircle, ShieldCheck } from "lucide-react";

const HELP_ITEMS = [
  {
    icon: MapPin,
    title: "NFC tag or pet profile",
    text: "If a tag scan does not open the expected pet profile, check the tag ID and owner lost-mode settings.",
  },
  {
    icon: MessageCircle,
    title: "Account and community",
    text: "For sign-in, posting, chat, or moderation questions, include your account email and the affected screen.",
  },
  {
    icon: ShieldCheck,
    title: "Safety or urgent pet issue",
    text: "For urgent rescue or safety situations, contact local services first, then use PawPal to notify the owner or community.",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-paw-page pt-28 pb-16 text-paw-ink">
      <section className="mx-auto max-w-5xl px-4">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-paw-primary">
          Support
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Help Center
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-paw-body">
          Quick guidance for common PawPal questions, from NFC safety tags to
          account and community support.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {HELP_ITEMS.map((item) => (
            <article
              key={item.title}
              className="rounded-paw-lg border border-paw-border bg-paw-panel p-5 shadow-paw-panel"
            >
              <item.icon className="h-6 w-6 text-paw-primary" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-extrabold text-paw-ink">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-paw-body">{item.text}</p>
            </article>
          ))}
        </div>

        <a
          href="mailto:hello@pawpal.be"
          className="mt-8 inline-flex items-center gap-2 rounded-paw-md bg-paw-primary px-5 py-3 text-sm font-bold text-white shadow-paw-action transition hover:bg-paw-primary-hover"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Contact support
        </a>
      </section>
    </div>
  );
}
