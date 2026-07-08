import type { Metadata } from "next";
import { publicPageMetadata } from "./metadata";
import { enMessages } from "@/i18n/messages";
import {
  FadeIn,
  FadeInView,
  HeroCTA,
  GlobeSection,
  BottomCTA,
  AnimatedHeadline,
  HeroDescription,
  ScrollProgress,
  HeroBlobs,
  TrustMarquee,
  AppShowcase,
  ProductFlow,
} from "@/components/HomeClientParts";
import { Card } from "@/components/ui";

export const metadata: Metadata = publicPageMetadata({
  title: enMessages.homeMetadataTitle,
  description: enMessages.homeMetadataDescription,
  path: "/",
});

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
          </FadeIn>

          <GlobeSection />
        </div>
      </section>

      <section className="border-y border-paw-border bg-paw-panel-subtle/70">
        <div className="mx-auto max-w-7xl">
          <TrustMarquee />
        </div>
      </section>

      <section id="workflow" className="bg-paw-page py-paw-xxxl">
        <div className="mx-auto max-w-6xl px-paw-md sm:px-paw-xl lg:px-paw-xxl">
          <FadeInView>
            <h2 className="text-center font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
              {enMessages.homeWorkflowTitle}
            </h2>
          </FadeInView>
          <div className="mt-paw-xxl">
            <ProductFlow />
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-paw-outline-variant bg-paw-panel-subtle py-paw-xxxl">
        <div className="mx-auto max-w-7xl px-paw-md sm:px-paw-xl lg:px-paw-xxl">
          <AppShowcase />
        </div>
      </section>

      <section className="bg-paw-page py-paw-xxl sm:py-paw-xxxl">
        <div className="mx-auto max-w-7xl px-paw-md sm:px-paw-xl lg:px-paw-xxl">
          <Card
            variant="hero"
            tone="primary"
            elevation="subtle"
            className="grid items-center gap-paw-xl p-paw-xl text-center sm:p-paw-xxl lg:grid-cols-[1fr_auto] lg:text-left"
          >
            <FadeInView>
              <h2 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
                {enMessages.homeFinalCtaTitle}
              </h2>
              <p className="mx-auto mt-paw-sm max-w-2xl text-paw-type-body text-paw-body lg:mx-0">
                {enMessages.homeFinalCtaCopy}
              </p>
            </FadeInView>
            <FadeInView delay={0.08}>
              <BottomCTA />
            </FadeInView>
          </Card>
        </div>
      </section>
    </div>
  );
}
