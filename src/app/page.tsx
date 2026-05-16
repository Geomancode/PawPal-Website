import { Heart, Globe as GlobeIcon, Users, Sparkles } from "lucide-react";
import {
  FadeIn, FadeInView, HeroCTA, HeroBadges, GlobeSection, BottomCTA,
} from "@/components/HomeClientParts";

export default function Home() {
  return (
    <div className="relative w-full overflow-hidden bg-[#FFFDF9]">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen">
        {/* Soft background blobs — brand Blue + Amber */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] rounded-full bg-[#F59E0B]/15 blur-[100px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-[#4A90D9]/12 blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-0">
          <div className="flex flex-col lg:flex-row items-center justify-between min-h-[calc(100vh-5rem)] gap-8">

            {/* Left: Text */}
            <FadeIn className="w-full lg:w-1/2 flex flex-col justify-center space-y-7 z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass w-fit">
                <span className="flex w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                <span className="text-sm font-medium text-[#F59E0B]">Next Gen Pet Community</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight text-[#2D3748] font-brand">
                Every Pet Deserves a<br />
                <span className="text-gradient">Connected Life</span>
              </h1>

              <p className="text-lg lg:text-xl text-[#64748B] max-w-lg leading-relaxed">
                Discover real-time pet missions, adopt animals globally, or simply walk your dog with a community that cares.
              </p>

              <HeroCTA />
              <HeroBadges />
            </FadeIn>

            {/* Right: Globe */}
            <GlobeSection />
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="py-12 border-y border-gray-100 bg-white/60">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10K+", label: "Pet Lovers" },
            { value: "50+", label: "Countries" },
            { value: "5K+", label: "Missions Completed" },
            { value: "2K+", label: "Pets Adopted" },
          ].map((s, i) => (
            <FadeInView key={i} delay={i * 0.1}>
              <div className="text-3xl md:text-4xl font-extrabold text-gradient font-brand">{s.value}</div>
              <div className="text-sm text-[#64748B] mt-1 font-medium">{s.label}</div>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-4">
        <FadeInView>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#2D3748] mb-4 font-brand">
            Why PawPal?
          </h2>
        </FadeInView>
        <p className="text-center text-[#64748B] max-w-xl mx-auto mb-12">
          Everything you need to keep your furry (or scaly) friends happy and connected.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: GlobeIcon, title: "Global Map", desc: "See live missions around the world on our interactive 3D globe.", color: "bg-[#4A90D9]/10 text-[#4A90D9]" },
            { icon: Heart, title: "Adopt & Rescue", desc: "Find pets near you who need a loving home. Every click saves a life.", color: "bg-rose-50 text-rose-500" },
            { icon: Users, title: "Community", desc: "Connect with local pet owners, walkers, and sitters in your area.", color: "bg-[#10B981]/10 text-[#10B981]" },
            { icon: Sparkles, title: "AI Pet ID", desc: "Point your camera at any animal and let our AI identify breed, age, and more.", color: "bg-[#F59E0B]/10 text-[#F59E0B]" },
          ].map((f, i) => (
            <FadeInView key={i} delay={i * 0.08} className="glass p-6 rounded-2xl border border-gray-100 hover:border-[#4A90D9]/30 transition-all hover:shadow-lg group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color} mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#2D3748] mb-2">{f.title}</h3>
              <p className="text-[#64748B] text-sm leading-relaxed">{f.desc}</p>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 bg-gradient-to-r from-[#F59E0B]/8 to-[#4A90D9]/8">
        <div className="max-w-3xl mx-auto text-center px-4">
          <FadeInView>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3748] mb-4 font-brand">
              Ready to Join the Pack?
            </h2>
          </FadeInView>
          <p className="text-[#64748B] mb-8 text-lg">
            Download PawPal today and start connecting with pet lovers worldwide.
          </p>
          <BottomCTA />
        </div>
      </section>
    </div>
  );
}
