import {
  FadeIn, FadeInView, HeroCTA, HeroBadges, GlobeSection, BottomCTA,
  AnimatedHeadline, AnimatedCounter, ScrollProgress, HeroBlobs,
  BentoFeatureGrid, TrustMarquee, AppShowcase, FloatingParticles,
} from "@/components/HomeClientParts";

/* ── Inline SVG Pet Doodles (Pawlace-inspired line art) ── */
const DoodleDog = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M35 85c0-15 10-25 25-25s25 10 25 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="50" cy="48" r="3" fill="currentColor"/>
    <circle cx="70" cy="48" r="3" fill="currentColor"/>
    <path d="M55 55c2 3 8 3 10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M60 35c-15-5-25 5-28 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M60 35c15-5 25 5 28 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M30 45c-5-12 0-25 5-28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M90 45c5-12 0-25-5-28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M85 85v-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M80 95c5 0 8-3 8-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DoodleCat = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 80c0-12 8-22 20-22s20 10 20 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="52" cy="52" r="2.5" fill="currentColor"/>
    <circle cx="68" cy="52" r="2.5" fill="currentColor"/>
    <path d="M57 57c1.5 2 5.5 2 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M42 42l-8-20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M78 42l8-20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M34 22c3 5 8 15 8 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M86 22c-3 5-8 15-8 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M80 80c8 2 15-2 20-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M100 72c3-2 5-1 6 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="45" y1="55" x2="30" y2="52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="45" y1="58" x2="30" y2="60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="75" y1="55" x2="90" y2="52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="75" y1="58" x2="90" y2="60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const DoodlePaw = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="52" rx="14" ry="12" stroke="currentColor" strokeWidth="2.5"/>
    <ellipse cx="25" cy="35" rx="6" ry="8" stroke="currentColor" strokeWidth="2.5" transform="rotate(-15 25 35)"/>
    <ellipse cx="55" cy="35" rx="6" ry="8" stroke="currentColor" strokeWidth="2.5" transform="rotate(15 55 35)"/>
    <ellipse cx="35" cy="28" rx="5" ry="7" stroke="currentColor" strokeWidth="2.5" transform="rotate(-5 35 28)"/>
    <ellipse cx="47" cy="28" rx="5" ry="7" stroke="currentColor" strokeWidth="2.5" transform="rotate(5 47 28)"/>
  </svg>
);

const DoodleBone = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 15c-5-8-18-5-18 5s13 13 18 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M75 15c5-8 18-5 18 5s-13 13-18 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M25 20h50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M25 30c-5 8-18 5-18-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M75 30c5 8 18 5 18-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M25 30h50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function Home() {
  return (
    <div className="noise-overlay relative w-full overflow-hidden bg-paw-page text-paw-ink">
      {/* Scroll progress bar at top */}
      <ScrollProgress />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen">
        {/* Animated breathing background blobs */}
        <HeroBlobs />

        {/* Pet doodle decorations */}
        <div className="absolute top-[15%] right-[5%] hidden h-16 w-16 text-paw-primary/15 doodle-float lg:block" style={{ animationDelay: "0s" }}>
          <DoodlePaw className="w-full h-full" />
        </div>
        <div className="absolute bottom-[20%] left-[3%] hidden h-20 w-20 text-paw-primary/10 doodle-float-alt lg:block" style={{ animationDelay: "2s" }}>
          <DoodleBone className="w-full h-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-0">
          <div className="flex flex-col lg:flex-row items-center justify-between min-h-[calc(100vh-5rem)] gap-8">

            {/* Left: Text */}
            <FadeIn className="w-full lg:w-1/2 flex flex-col justify-center space-y-7 z-10">
              {/* Badge */}
              <FadeIn delay={0.1}>
                <div className="inline-flex w-fit items-center gap-2 rounded-paw-md border border-paw-primary/20 bg-paw-primary-soft px-4 py-2">
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-paw-primary" />
                  <span className="text-sm font-bold text-paw-primary">Smart Pet Life Platform</span>
                </div>
              </FadeIn>

              {/* Animated word-by-word headline */}
              <AnimatedHeadline />

              {/* Description */}
              <FadeIn delay={0.9}>
                <p className="max-w-lg text-lg leading-relaxed text-paw-body lg:text-xl">
                  PawPal enhances the bond between you and your pet — with gamified walks, fog-of-war maps, NFC safety tags, an AI assistant, and a trusted local community — all built for pet lovers.
                </p>
              </FadeIn>

              <HeroCTA />
              <HeroBadges />
            </FadeIn>

            {/* Right: Globe */}
            <GlobeSection />
          </div>
        </div>
      </section>

      {/* ===== TRUST MARQUEE ===== */}
      <section className="border-y border-paw-border bg-paw-panel-subtle">
        <TrustMarquee />
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-gradient-to-b from-paw-panel-subtle to-paw-page py-14">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "58%", label: "Belgian Pet Households" },
            { value: "€122", label: "Monthly Pet Spending" },
            { value: "2M+", label: "Dogs in Belgium" },
            { value: "5", label: "Languages Supported" },
          ].map((s, i) => (
            <AnimatedCounter key={i} value={s.value} label={s.label} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* ===== FEATURES — Bento Grid ===== */}
      <section id="features" className="relative bg-paw-primary-soft/45 py-20">
        <div className="max-w-6xl mx-auto px-4 relative">
        {/* Decorative doodles */}
        <div className="absolute top-10 right-0 hidden h-24 w-24 text-paw-primary/10 doodle-float-alt lg:block">
          <DoodleDog className="w-full h-full" />
        </div>
        <div className="absolute bottom-10 left-0 hidden h-20 w-20 text-paw-trust/10 doodle-float lg:block" style={{ animationDelay: "3s" }}>
          <DoodleCat className="w-full h-full" />
        </div>

        <FadeInView>
          <h2 className="mb-4 text-center font-brand text-3xl font-bold text-paw-ink md:text-4xl">
            Two Modes, One Platform
          </h2>
        </FadeInView>
        <FadeInView delay={0.1}>
          <p className="mx-auto mb-12 max-w-xl text-center text-paw-body">
            Solo Mode for your daily walks and pet management. Community Mode for local connections and mutual help.
          </p>
        </FadeInView>

        <BentoFeatureGrid />
        </div>
      </section>

      {/* ===== APP SHOWCASE ===== */}
      <section className="bg-gradient-to-b from-paw-page to-paw-primary-soft py-20">
        <div className="max-w-6xl mx-auto px-4">
          <AppShowcase />
        </div>
      </section>

      {/* ===== CTA SECTION — Dark with Particles ===== */}
      <section className="relative py-24 bg-paw-ink overflow-hidden">
        {/* Floating particles */}
        <FloatingParticles />

        {/* Pet doodle in dark section */}
        <div className="absolute top-[15%] right-[8%] w-20 h-20 text-white/5 doodle-float hidden lg:block">
          <DoodlePaw className="w-full h-full" />
        </div>
        <div className="absolute bottom-[15%] left-[8%] w-16 h-16 text-white/5 doodle-float-alt hidden lg:block">
          <DoodleBone className="w-full h-full" />
        </div>

        <div className="max-w-3xl mx-auto text-center px-4 relative z-10">
          <FadeInView>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-brand">
              🇧🇪 Born in Ghent, Built for Pet Lovers
            </h2>
          </FadeInView>
          <FadeInView delay={0.1}>
            <p className="text-white/60 mb-10 text-lg">
              Built by a Ghent University team. GDPR-first design, EU-hosted data, 5 languages ready. Download PawPal and start your journey.
            </p>
          </FadeInView>
          <BottomCTA />
        </div>
      </section>
    </div>
  );
}
