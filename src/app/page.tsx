import { Heart, Globe as GlobeIcon, Users, Sparkles } from "lucide-react";
import {
  FadeIn, FadeInView, HeroCTA, HeroBadges, GlobeSection, BottomCTA,
  AnimatedHeadline, AnimatedCounter, SpotlightCard, ScrollProgress, HeroBlobs,
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

      {/* ===== STATS BAR — Animated Counters ===== */}
      <section className="py-12 border-y border-gray-100 bg-white/60">
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

      {/* ===== FEATURES GRID — Spotlight Cards ===== */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: GlobeIcon, title: "Global Map", desc: "See live missions around the world on our interactive 3D globe.", color: "bg-[#4A90D9]/10 text-[#4A90D9]" },
            { icon: Heart, title: "Adopt & Rescue", desc: "Find pets near you who need a loving home. Every click saves a life.", color: "bg-rose-50 text-rose-500" },
            { icon: Users, title: "Community", desc: "Connect with local pet owners, walkers, and sitters in your area.", color: "bg-[#10B981]/10 text-[#10B981]" },
            { icon: Sparkles, title: "AI Pet ID", desc: "Point your camera at any animal and let our AI identify breed, age, and more.", color: "bg-[#F59E0B]/10 text-[#F59E0B]" },
          ].map((f, i) => (
            <SpotlightCard key={i} className="glass p-6 rounded-2xl border border-gray-100 hover:border-[#4A90D9]/30 transition-all duration-300 hover:shadow-lg group cursor-default">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#2D3748] mb-2">{f.title}</h3>
              <p className="text-[#64748B] text-sm leading-relaxed">{f.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative py-20 bg-gradient-to-r from-[#F59E0B]/8 to-[#4A90D9]/8 overflow-hidden">
        {/* Subtle animated blob in CTA */}
        <div className="absolute top-[20%] left-[60%] w-[30%] h-[60%] rounded-full bg-[#4A90D9]/5 blur-[80px] blob-animate-3" />

        <div className="max-w-3xl mx-auto text-center px-4 relative z-10">
          <FadeInView>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3748] mb-4 font-brand">
              Ready to Join the Pack?
            </h2>
          </FadeInView>
          <FadeInView delay={0.1}>
            <p className="text-[#64748B] mb-8 text-lg">
              Download PawPal today and start connecting with pet lovers worldwide.
            </p>
          </FadeInView>
          <BottomCTA />
        </div>
      </section>
    </div>
  );
}
