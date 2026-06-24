import type { Metadata } from "next";
import {
  FadeIn,
  FadeInView,
  HeroCTA,
  GlobeSection,
  BottomCTA,
  AnimatedHeadline,
  HeroDescription,
  HeroSignalRail,
  ScrollProgress,
  HeroBlobs,
  TrustMarquee,
  AppShowcase,
  ProductFlow,
} from "@/components/HomeClientParts";

export const metadata: Metadata = {
  title: "Pet Safety Map, Smart Tags, and Local Pet Community",
  description:
    "PawPal combines fog-of-war walks, NFC pet safety profiles, AI care guidance, and trusted local pet help from Belgium outward.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <div className="relative w-full overflow-x-hidden bg-paw-page text-paw-ink">
      <ScrollProgress />

      <section className="relative isolate overflow-hidden pt-16 lg:pt-20">
        <HeroBlobs />
        <div className="mx-auto grid min-w-0 max-w-7xl items-center gap-5 px-4 pb-4 pt-5 sm:px-6 md:gap-8 md:pb-8 lg:min-h-[560px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-8 lg:px-8 lg:pb-0 lg:pt-0">
          <FadeIn className="z-10 min-w-0 max-w-2xl space-y-5 lg:space-y-6">
            <AnimatedHeadline />
            <HeroDescription />
            <HeroCTA />
            <HeroSignalRail />
          </FadeIn>

          <GlobeSection />
        </div>
      </section>

      <section className="border-y border-paw-border bg-paw-panel-subtle/70">
        <div className="mx-auto max-w-7xl">
          <TrustMarquee />
        </div>
      </section>

      <section id="workflow" className="bg-paw-page py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <FadeInView>
            <h2 className="text-center font-brand text-3xl font-extrabold text-paw-ink md:text-4xl">
              From walk to rescue, one connected flow.
            </h2>
          </FadeInView>
          <div className="mt-14">
            <ProductFlow />
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-paw-border bg-paw-panel-subtle py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <AppShowcase />
        </div>
      </section>

      <section className="bg-paw-page py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="home-final-cta grid items-center gap-6 px-6 py-9 text-center sm:px-10 lg:grid-cols-[1fr_auto] lg:text-left">
            <FadeInView>
              <h2 className="font-brand text-3xl font-extrabold leading-tight text-white md:text-4xl">
                Ready to make every walk safer?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/78 md:text-base lg:mx-0">
                Open the live map, prepare a smart tag, and connect your pet profile to real-world help.
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
