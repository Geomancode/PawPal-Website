const PRIVACY_SECTIONS = [
  {
    title: "Data we use",
    text: "PawPal uses account, pet profile, map, walk, store, and community data to provide the product features you choose to use.",
  },
  {
    title: "Location and safety",
    text: "Location features are used for maps, walks, nearby places, and safety workflows. Public finder pages only show the information owners choose to expose.",
  },
  {
    title: "Your choices",
    text: "You can update account details, pet profile visibility, lost-mode settings, and communication preferences from the app or by contacting support.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paw-page pt-28 pb-16 text-paw-ink">
      <section className="mx-auto max-w-4xl px-4">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-paw-primary">
          Policy
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-base leading-7 text-paw-body">
          PawPal is designed around controlled sharing: owners decide what is
          public, what stays private, and when lost-mode information should be
          visible.
        </p>

        <div className="mt-10 space-y-4">
          {PRIVACY_SECTIONS.map((section) => (
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
