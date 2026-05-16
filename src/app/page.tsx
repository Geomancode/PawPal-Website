import {
  FadeIn, FadeInView, HeroCTA, HeroBadges, GlobeSection, BottomCTA,
  AnimatedHeadline, AnimatedCounter, SpotlightCard, ScrollProgress, HeroBlobs,
  BentoFeatureGrid, TrustMarquee, AppShowcase, FloatingParticles, MagneticButton,
} from "@/components/HomeClientParts";

export default function Home() {
  return (
    <div className="relative w-full overflow-hidden bg-[#FFFDF9] noise-overlay">
      {/* Scroll progress bar at top */}
      <ScrollProgress />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen">
        {/* Animated breathing background blobs */}
        <HeroBlobs />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-0">
          <div className="flex flex-col lg:flex-row items-center justify-between min-h-[calc(100vh-5rem)] gap-8">

            {/* Left: Text */}
            <FadeIn className="w-full lg:w-1/2 flex flex-col justify-center space-y-7 z-10">
              {/* Badge */}
              <FadeIn delay={0.1}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass w-fit">
                  <span className="flex w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                  <span className="text-sm font-medium text-[#F59E0B]">Next Gen Pet Community</span>
                </div>
              </FadeIn>

              {/* Animated word-by-word headline */}
              <AnimatedHeadline />

              {/* Description */}
              <FadeIn delay={0.9}>
                <p className="text-lg lg:text-xl text-[#64748B] max-w-lg leading-relaxed">
                  Discover real-time pet missions, adopt animals globally, or simply walk your dog with a community that cares.
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

      {/* ===== TRUST MARQUEE — Phase 2 ===== */}
      <section className="border-y border-gray-100 bg-white/40">
        <TrustMarquee />
      </section>

      {/* ===== STATS BAR — Animated Counters ===== */}
      <section className="py-14 bg-white/60">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10K+", label: "Pet Lovers" },
            { value: "50+", label: "Countries" },
            { value: "5K+", label: "Missions Completed" },
            { value: "2K+", label: "Pets Adopted" },
          ].map((s, i) => (
            <AnimatedCounter key={i} value={s.value} label={s.label} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* ===== FEATURES — Bento Grid (Phase 2) ===== */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-4">
        <FadeInView>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#2D3748] mb-4 font-brand">
            Why PawPal?
          </h2>
        </FadeInView>
        <FadeInView delay={0.1}>
          <p className="text-center text-[#64748B] max-w-xl mx-auto mb-12">
            Everything you need to keep your furry (or scaly) friends happy and connected.
          </p>
        </FadeInView>

        <BentoFeatureGrid />
      </section>

      {/* ===== APP SHOWCASE — Phone Mockups (Phase 2) ===== */}
      <section className="py-20 bg-gradient-to-b from-white/40 to-[#FFFDF9]">
        <div className="max-w-6xl mx-auto px-4">
          <AppShowcase />
        </div>
      </section>

      {/* ===== CTA SECTION — With Floating Particles (Phase 3) ===== */}
      <section className="relative py-24 bg-gradient-to-br from-[#2D3748] to-[#1a202c] overflow-hidden">
        {/* Floating particles */}
        <FloatingParticles />

        {/* Subtle gradient blobs */}
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[50%] rounded-full bg-[#4A90D9]/8 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[15%] w-[30%] h-[40%] rounded-full bg-[#F59E0B]/6 blur-[100px]" />

        <div className="max-w-3xl mx-auto text-center px-4 relative z-10">
          <FadeInView>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-brand">
              Ready to Join the Pack?
            </h2>
          </FadeInView>
          <FadeInView delay={0.1}>
            <p className="text-white/60 mb-10 text-lg">
              Download PawPal today and start connecting with pet lovers worldwide.
            </p>
          </FadeInView>
          <BottomCTA />
        </div>
      </section>
    </div>
  );
}
