import type { Metadata } from "next";
import {
  FadeIn,
  FadeInView,
  HeroCTA,
  HeroBadges,
  GlobeSection,
  BottomCTA,
  AnimatedHeadline,
  HeroDescription,
  ScrollProgress,
  HeroBlobs,
  BentoFeatureGrid,
  TrustMarquee,
  AppShowcase,
  ProductFlow,
} from "@/components/HomeClientParts";

export const metadata: Metadata = {
  title: "PawPal | Pet Safety, Walks, and Community on One Map",
  description:
    "PawPal combines fog-of-war walks, NFC pet safety profiles, AI care help, and a trusted local pet community.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <div className="relative w-full overflow-x-hidden bg-white text-paw-ink">
      <ScrollProgress />

      <section className="relative isolate overflow-hidden pt-24 lg:pt-28">
        <HeroBlobs />
        <div className="mx-auto grid min-h-[650px] min-w-0 max-w-7xl items-center gap-10 px-5 pb-8 pt-6 sm:px-6 lg:min-h-[700px] lg:grid-cols-[0.95fr_1.05fr] lg:gap-8 lg:px-8 lg:pt-0">
          <FadeIn className="z-10 min-w-0 max-w-2xl space-y-7">
            <AnimatedHeadline />
            <HeroDescription />
            <HeroCTA />
            <HeroBadges />
          </FadeIn>

          <GlobeSection />
        </div>
      </section>

      <section className="border-y border-paw-border bg-white">
        <div className="mx-auto max-w-7xl">
          <TrustMarquee />
        </div>
      </section>

      <section id="workflow" className="bg-white py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <FadeInView>
            <h2 className="text-center font-brand text-3xl font-extrabold text-paw-ink md:text-4xl">
              One platform, every day.
            </h2>
          </FadeInView>
          <div className="mt-14">
            <ProductFlow />
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <BentoFeatureGrid />
        </div>
      </section>

      <section className="border-y border-paw-border bg-paw-panel-subtle py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <AppShowcase />
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 rounded-paw-md border border-paw-border bg-gradient-to-br from-paw-primary-soft via-white to-paw-trust-soft px-6 py-10 sm:px-10 lg:grid-cols-[1fr_auto]">
            <FadeInView>
              <h2 className="font-brand text-3xl font-extrabold leading-tight text-paw-ink md:text-4xl">
                Ready to explore, protect and connect?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-paw-body md:text-base">
                Join pet parents building safer daily walks and more useful local pet communities.
              </p>
            </FadeInView>
            <FadeInView delay={0.08}>
              <BottomCTA />
            </FadeInView>
          </div>
        </div>
      </section>
    </div>
  );
}
