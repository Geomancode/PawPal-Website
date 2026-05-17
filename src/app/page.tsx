import { Heart, Globe as GlobeIcon, Users, Sparkles } from "lucide-react";
import {
  FadeIn, FadeInView, HeroCTA, HeroBadges, GlobeSection, BottomCTA,
} from "@/components/HomeClientParts";
import Badge from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="paw-page relative w-full overflow-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[calc(100vh-4rem)] pb-16">
        <div className="paw-section pt-28 lg:pt-20">
          <div className="flex flex-col lg:flex-row items-center justify-between min-h-[calc(100vh-9rem)] gap-8">

            {/* Left: Text */}
            <FadeIn className="w-full lg:w-1/2 flex flex-col justify-center space-y-6 z-10">
              <Badge tone="primary" className="w-fit">
                <span className="flex w-2 h-2 rounded-full bg-paw-success" />
                Live pet map, NFC identity, and community
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-paw-ink">
                The Smart Map<br />
                For <span className="text-gradient">Pet Lovers</span>
              </h1>

              <p className="text-base lg:text-lg text-paw-body max-w-xl leading-relaxed">
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
      <section className="py-10 border-y border-paw-border bg-paw-panel">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10K+", label: "Pet Lovers" },
            { value: "50+", label: "Countries" },
            { value: "5K+", label: "Missions Completed" },
            { value: "2K+", label: "Pets Adopted" },
          ].map((s, i) => (
            <FadeInView key={i} delay={i * 0.1}>
              <div className="text-3xl md:text-4xl font-extrabold text-gradient">{s.value}</div>
              <div className="text-sm text-paw-muted mt-1 font-bold">{s.label}</div>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section id="features" className="py-20 paw-section">
        <FadeInView>
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-paw-ink mb-4">
            Why PawPal?
          </h2>
        </FadeInView>
        <p className="text-center text-paw-body max-w-xl mx-auto mb-12">
          Everything you need to keep your furry (or scaly) friends happy and connected.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: GlobeIcon, title: "Global Map", desc: "See live missions around the world on our interactive 3D globe.", color: "bg-paw-primary-soft text-paw-primary" },
            { icon: Heart, title: "Adopt & Rescue", desc: "Find pets near you who need a loving home. Every click saves a life.", color: "bg-paw-danger-soft text-paw-danger" },
            { icon: Users, title: "Community", desc: "Connect with local pet owners, walkers, and sitters in your area.", color: "bg-paw-success-soft text-paw-success" },
            { icon: Sparkles, title: "AI Pet ID", desc: "Point your camera at any animal and let our AI identify breed, age, and more.", color: "bg-paw-accent-soft text-paw-accent" },
          ].map((f, i) => (
            <FadeInView key={i} delay={i * 0.08}>
              <Card className="h-full transition hover:-translate-y-1 hover:border-paw-primary/30">
                <CardContent>
                  <div className={`w-12 h-12 rounded-paw-md flex items-center justify-center ${f.color} mb-4`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-paw-ink mb-2">{f.title}</h3>
                  <p className="text-paw-body text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 bg-paw-panel border-y border-paw-border">
        <div className="max-w-3xl mx-auto text-center px-4">
          <FadeInView>
            <h2 className="text-3xl md:text-4xl font-extrabold text-paw-ink mb-4">
              Ready to Join the Pack?
            </h2>
          </FadeInView>
          <p className="text-paw-body mb-8 text-lg">
            Download PawPal today and start connecting with pet lovers worldwide.
          </p>
          <BottomCTA />
        </div>
      </section>
    </div>
  );
}
