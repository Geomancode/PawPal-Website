"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Globe,
  GraduationCap,
  Heart,
  Languages,
  Mail,
  Map,
  MapPin,
  Nfc,
  PawPrint,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
  PageShell,
  buttonClassName,
} from "@/components/ui";

/* ── Animation helpers ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 1, y: 0 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay },
});

/* ── Real Team Data ── */
const TEAM = [
  {
    name: "Alexie",
    role: "Co-founder & CEO",
    desc: "PhD candidate in GIS & Remote Sensing at Ghent University. Leads product strategy, technical architecture, and fundraising.",
  },
  {
    name: "Neumann",
    role: "Co-founder & CPO",
    desc: "Business & Marketing background. Drives business model, go-to-market strategy, operations, and supply chain.",
  },
  {
    name: "Carlo",
    role: "Co-founder & CDO",
    desc: "Design background. Leads UI/UX design, brand visual identity, and user research across all PawPal platforms.",
  },
];

/* ── Product Ecosystem ── */
const ECOSYSTEM = [
  {
    icon: Smartphone,
    title: "PawPal App",
    desc: "Walk recording with fog-of-war map, PawPoints rewards, pet profiles, daily reminders, AI assistant, NFC tag enrollment, and real-time community — all in one app.",
    tone: "bg-paw-primary-soft text-paw-on-primary-soft",
  },
  {
    icon: Globe,
    title: "PawPal Web",
    desc: "NFC tag scan landing pages at pawpal.be/tag/{id} — zero-download pet rescue. Plus the online store, AI-powered search, and the interactive Globe map.",
    tone: "bg-paw-trust-soft text-paw-on-trust-soft",
  },
  {
    icon: Nfc,
    title: "NFC Smart Tags",
    desc: "Starting at €19. Dynamic profile pages replace static dog tags. Privacy-first: owner contact info stays hidden until lost mode is activated.",
    tone: "bg-paw-green-soft text-paw-on-green-soft",
  },
];

/* ── Values ── */
const VALUES = [
  { icon: Heart, title: "Enhance, Not Replace", desc: "Our mission is not to replace companionship with technology, but to enhance the bond between humans and their pets through smart tools." },
  { icon: Shield, title: "Privacy & Trust", desc: "GDPR-first design. Location recorded only during walks. NFC tags protect owner privacy by default. EU-hosted data with row-level security." },
  { icon: Users, title: "Local Community", desc: "PawPal connects neighbors through their pets — find nearby dog walkers, request mutual help, and build trust through verified interactions." },
  { icon: Sparkles, title: "AI-Powered Care", desc: "Gemini AI for breed recognition, behavior analysis, and daily care advice. Clearly labeled as non-medical — always consult a vet for health concerns." },
  { icon: MapPin, title: "Born in Belgium", desc: "Founded in Ghent. Deep understanding of Flemish pet culture. 5-language support (EN/NL/FR/DE/ZH) ready for European expansion." },
  { icon: Map, title: "Gamified Exploration", desc: "H3 hexagonal fog-of-war maps turn every dog walk into an adventure. Earn PawPoints for exploring new areas, streaks, and community contributions." },
];

/* ── Real Timeline ── */
const TIMELINE = [
  { year: "2024", event: "The idea is born — three pet lovers in Ghent imagine a smarter way to care for pets and connect local communities." },
  { year: "2025 Q1", event: "Full-stack MVP complete: Flutter app + Next.js website + Supabase backend with 52 database migrations and PostGIS spatial engine." },
  { year: "2025 Q2", event: "AI agent (Gemini), NFC tag system, real-time chat, and 5-language internationalization (EN/NL/FR/DE/ZH) shipped." },
  { year: "2025 H2", event: "Fog-of-war map engine (H3 hexagons), gamified walk tracking with weather sync, PawPoints reward system designed and built." },
  { year: "2026", event: "Ghent cold start: '500 NFC collars' campaign, local partnerships with pet shops and vet clinics, angel round fundraising." },
];

const TEAM_STRENGTHS: Array<{ icon: LucideIcon; text: string }> = [
  { icon: GraduationCap, text: "GIS PhD × LBS Product" },
  { icon: Zap, text: "52 DB Migrations Shipped" },
  { icon: Languages, text: "5 Languages Ready" },
  { icon: MapPin, text: "Rooted in Ghent" },
];

export default function About() {
  return (
    <PageShell className="pt-28 sm:pt-32" contentClassName="space-y-paw-xxxl">
      {/* ===== HERO ===== */}
      <section className="grid gap-paw-xl lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:items-stretch">
        <Card className="flex min-h-full flex-col justify-center p-paw-xl sm:p-paw-xxl">
          <motion.div {...fadeUp()}>
            <Badge tone="primary" className="mb-paw-lg">
              <PawPrint className="h-4 w-4" aria-hidden="true" />
              Product proof from Ghent
            </Badge>
          </motion.div>

          <motion.h1
            {...fadeUp(0.1)}
            className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display"
          >
            A connected safety layer for everyday pet care.
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="mt-paw-md max-w-2xl text-paw-type-body text-paw-body sm:text-base"
          >
            PawPal connects the moments around a pet: walks, finder pages,
            smart tags, store orders, and local support. The web layer gives
            owners and finders a clear path without requiring the app first.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="mt-paw-xl flex flex-wrap gap-paw-sm">
            <Link href="/globe" className={buttonClassName({ size: "lg" })}>
              Explore Globe
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/store"
              className={buttonClassName({ variant: "secondary", size: "lg" })}
            >
              Shop smart tags
            </Link>
          </motion.div>
        </Card>

        <motion.aside {...fadeUp(0.18)}>
          <Card className="relative min-h-[31rem] overflow-hidden p-paw-xl sm:p-paw-xxl">
            <div className="hero-map-grid pointer-events-none absolute inset-0 opacity-35" />
            <div className="relative z-10">
              <p className="text-paw-type-caption font-black uppercase text-paw-muted">
                Product system
              </p>
              <h2 className="mt-paw-xs text-paw-type-h2 font-black text-paw-ink">
                App, Web, and NFC tags work as one loop.
              </h2>
              <div className="mt-paw-lg space-y-paw-sm">
                {[
                  { icon: Smartphone, label: "Daily care", copy: "Walks, pets, reminders, and AI guidance." },
                  { icon: Nfc, label: "Physical safety", copy: "Smart tags open controlled finder pages." },
                  { icon: Globe, label: "Local network", copy: "Map places, community help, and support routes." },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-paw-sm rounded-paw-card border border-paw-outline-variant bg-paw-panel-subtle p-paw-sm"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-paw-ink">{item.label}</p>
                      <p className="mt-paw-xxs text-xs leading-5 text-paw-body">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-paw-lg grid grid-cols-2 gap-paw-sm">
                {[
                  { value: "Finder pages", label: "Controlled public safety flow" },
                  { value: "Smart tags", label: "Physical scan entry" },
                  { value: "Store orders", label: "Stripe-backed purchase path" },
                  { value: "Globe map", label: "Local pet-care context" },
                ].map((s) => (
                  <Card key={s.value} className="p-paw-sm text-center shadow-paw-panel">
                    <div className="text-base font-black leading-tight text-paw-on-primary-soft">
                      {s.value}
                    </div>
                    <div className="mt-paw-xxs text-xs font-semibold text-paw-muted">
                      {s.label}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </motion.aside>
      </section>

      {/* ===== MISSION STATEMENT ===== */}
      <section>
        <Card className="mx-auto max-w-3xl p-paw-xl text-center sm:p-paw-xxl">
          <motion.div {...fadeUp()}>
            <p className="text-paw-type-h2 font-black leading-snug text-paw-ink sm:text-3xl">
              &ldquo;PawPal&apos;s mission is not to replace companionship with technology, but to{" "}
              <span className="text-paw-on-primary-soft">enhance</span> the bond between humans and their pets
              through smart tools.&rdquo;
            </p>
            <p className="mt-paw-md text-sm font-semibold text-paw-muted">— PawPal Founding Team · Ghent, Belgium</p>
          </motion.div>
        </Card>
      </section>

      {/* ===== PRODUCT ECOSYSTEM ===== */}
      <section>
        <motion.div {...fadeUp()} className="mx-auto mb-paw-xxl max-w-2xl text-center">
          <h2 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">The PawPal Ecosystem</h2>
          <p className="mx-auto mt-paw-sm text-paw-body">App + Web + Hardware — three products, one mission: enhance every moment with your pet.</p>
        </motion.div>

        <div className="grid gap-paw-lg md:grid-cols-3">
          {ECOSYSTEM.map((item, i) => (
            <motion.div key={item.title} {...fadeUp(i * 0.08)}>
              <Card className="h-full transition hover:-translate-y-1 hover:border-paw-primary/30 hover:shadow-paw-floating">
                <CardContent>
                  <div className={`mb-paw-lg flex h-14 w-14 items-center justify-center rounded-paw-panel ${item.tone}`}>
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-paw-type-h3 font-black text-paw-ink">{item.title}</h3>
                  <p className="mt-paw-sm text-sm leading-6 text-paw-body">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== VALUES ===== */}
      <section>
        <motion.div {...fadeUp()} className="mx-auto mb-paw-xxl max-w-2xl text-center">
          <h2 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">What We Stand For</h2>
          <p className="mx-auto mt-paw-sm text-paw-body">Our values guide every decision — from the features we build to the community we grow.</p>
        </motion.div>

        <div className="grid gap-paw-md md:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v, i) => (
            <motion.div key={v.title} {...fadeUp(i * 0.06)}>
              <Card className="h-full transition hover:border-paw-primary/30 hover:shadow-paw-floating">
                <CardContent>
                  <span className="mb-paw-md flex h-11 w-11 items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
                    <v.icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-black text-paw-ink">{v.title}</h3>
                  <p className="mt-paw-xs text-sm leading-6 text-paw-body">{v.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== TEAM ===== */}
      <section className="mx-auto max-w-5xl">
        <motion.div {...fadeUp()} className="mx-auto mb-paw-xxl max-w-2xl text-center">
          <h2 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">Meet the Founding Team</h2>
          <p className="mx-auto mt-paw-sm text-paw-body">A cross-disciplinary trio from Ghent — engineering, business, and design — united by a shared love for pets.</p>
        </motion.div>

        <div className="grid gap-paw-lg md:grid-cols-3">
          {TEAM.map((member, i) => (
            <motion.div key={member.name} {...fadeUp(i * 0.1)}>
              <Card className="h-full text-center transition hover:-translate-y-1 hover:border-paw-primary/30 hover:shadow-paw-floating">
                <CardContent>
                  <div className="mx-auto mb-paw-md flex h-20 w-20 items-center justify-center rounded-paw-pill border border-paw-outline-variant bg-paw-primary-soft text-2xl font-black text-paw-on-primary-soft shadow-paw-panel">
                    {member.name.slice(0, 1)}
                  </div>
                  <h3 className="text-lg font-black text-paw-ink">{member.name}</h3>
                  <p className="mb-paw-sm text-xs font-black uppercase text-paw-on-primary-soft">{member.role}</p>
                  <p className="text-sm leading-6 text-paw-body">{member.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Team strengths */}
        <motion.div {...fadeUp(0.3)} className="mt-paw-xl grid gap-paw-sm sm:grid-cols-2 md:grid-cols-4">
          {TEAM_STRENGTHS.map((s) => (
            <Card key={s.text} className="shadow-paw-panel">
              <CardContent className="flex items-center gap-paw-sm p-paw-md">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
                  <s.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-bold text-paw-body">{s.text}</span>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="mx-auto max-w-3xl">
        <motion.div {...fadeUp()} className="mb-paw-xxl text-center">
          <h2 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">Our Journey</h2>
          <p className="mt-paw-sm text-paw-body">From a spark of an idea to a production-ready platform.</p>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute bottom-0 left-[18px] top-0 w-0.5 bg-paw-outline-variant md:left-1/2 md:-translate-x-0.5" />

          {TIMELINE.map((item, i) => (
            <motion.div
              key={item.year}
              {...fadeUp(i * 0.08)}
              className={`relative mb-paw-xl flex items-start gap-paw-md md:mb-paw-xxl ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
            >
              {/* Dot */}
              <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-paw-pill border-4 border-paw-primary-soft bg-paw-primary md:absolute md:left-1/2 md:-translate-x-1/2">
                <PawPrint className="h-3.5 w-3.5 text-paw-on-primary" />
              </div>
              {/* Card */}
              <Card className={`flex-1 p-paw-md shadow-paw-panel md:max-w-[45%] ${i % 2 === 0 ? "md:mr-auto" : "md:ml-auto"}`}>
                <span className="text-xs font-black uppercase text-paw-on-primary-soft">{item.year}</span>
                <p className="mt-paw-xxs text-sm leading-6 text-paw-body">{item.event}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section>
        <Card className="mx-auto max-w-3xl p-paw-xl text-center sm:p-paw-xxl">
          <motion.div {...fadeUp()}>
            <h2 className="font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
              Join the PawPal Journey
            </h2>
            <p className="mx-auto mb-paw-xl mt-paw-md max-w-lg text-base leading-7 text-paw-body">
              We&apos;re building the platform we wished existed — for every dog owner, cat lover, and pet parent who believes technology should strengthen, not replace, the bond with their best friend.
            </p>
            <div className="flex flex-wrap justify-center gap-paw-sm">
              <a
                href="mailto:hello@pawpal.be"
                className={buttonClassName({ variant: "primary", size: "lg" })}
              >
                Contact the team <Mail className="h-5 w-5" />
              </a>
              <Link
                href="/globe"
                className={buttonClassName({ variant: "secondary", size: "lg" })}
              >
                Explore Globe
              </Link>
            </div>
          </motion.div>

          {/* Contact line */}
          <motion.div {...fadeUp(0.2)} className="mt-paw-xl flex items-center justify-center gap-paw-xs text-paw-muted">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Questions? Reach us at <a href="mailto:hello@pawpal.be" className="font-semibold text-paw-on-primary-soft hover:underline">hello@pawpal.be</a></span>
          </motion.div>
        </Card>
      </section>
    </PageShell>
  );
}
