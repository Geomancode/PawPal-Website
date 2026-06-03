const TERMS = [
  {
    title: "Use PawPal responsibly",
    text: "PawPal helps pet owners coordinate care, walks, safety, and community help. Do not misuse profiles, tags, maps, or community tools.",
  },
  {
    title: "Store purchases",
    text: "Store checkout is processed through Stripe. Product availability, pricing, and shipping details may change before an order is completed.",
  },
  {
    title: "Community content",
    text: "Posts, chats, reports, and public rescue information should be accurate, respectful, and safe for other owners and finders.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paw-page pt-28 pb-16 text-paw-ink">
      <section className="mx-auto max-w-4xl px-4">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-paw-primary">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-base leading-7 text-paw-body">
          These terms summarize the expected use of PawPal across the website,
          store, app, and public pet safety flows.
        </p>

        <div className="mt-10 space-y-4">
          {TERMS.map((section) => (
            <article
              key={section.title}
              className="rounded-paw-lg border border-paw-border bg-paw-panel p-5 shadow-paw-panel"
            >
              <h2 className="text-xl font-extrabold text-paw-ink">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-paw-body">{section.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
