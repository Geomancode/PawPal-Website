"use client";

import { motion } from "framer-motion";
import {
  Globe, Heart, Shield, Users, MapPin, Sparkles, Nfc, PawPrint,
  Smartphone, Map, Award, ArrowRight, Mail, Brain,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

/* ── Animation helpers ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay },
});

/* ── Real Team Data ── */
const TEAM = [
  {
    name: "Sean Xiao",
    nameCn: "肖轩",
    role: "Co-founder & CEO",
    photo: "/team/sean.jpg",
    color: "from-amber-400 to-orange-500",
    desc: "PhD candidate in GIS & Remote Sensing at Ghent University. Leads product strategy, technical architecture, and fundraising.",
  },
  {
    name: "Lingfeng Li",
    nameCn: "李凌枫",
    role: "Co-founder & CPO",
    photo: "/team/lingfeng.png",
    color: "from-blue-400 to-indigo-500",
    desc: "Business & Marketing background. Drives business model, go-to-market strategy, operations, and supply chain.",
  },
  {
    name: "Jieqiong",
    nameCn: "洁琼",
    role: "Co-founder & CDO",
    photo: "/team/jieqiong.jpg",
    color: "from-emerald-400 to-teal-500",
    desc: "Design background. Leads UI/UX design, brand visual identity, and user research across all PawPal platforms.",
  },
];

/* ── Product Ecosystem ── */
const ECOSYSTEM = [
  {
    icon: Smartphone,
    title: "PawPal App",
    desc: "Walk recording with fog-of-war map, PawPoints rewards, pet profiles, daily reminders, AI assistant, NFC tag enrollment, and real-time community — all in one app.",
    color: "bg-amber-50 text-amber-500",
    border: "border-amber-100",
  },
  {
    icon: Globe,
    title: "PawPal Web",
    desc: "NFC tag scan landing pages at pawpal.be/tag/{id} — zero-download pet rescue. Plus the online store, AI-powered search, and the interactive Globe map.",
    color: "bg-blue-50 text-blue-500",
    border: "border-blue-100",
  },
  {
    icon: Nfc,
    title: "NFC Smart Tags",
    desc: "Starting at €19. Dynamic profile pages replace static dog tags. Privacy-first: owner contact info stays hidden until lost mode is activated.",
    color: "bg-emerald-50 text-emerald-500",
    border: "border-emerald-100",
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

export default function About() {
  return (
    <div className="relative w-full overflow-hidden bg-[#fffdf9]">
      {/* ===== HERO ===== */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-amber-100/50 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-blue-100/30 blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div {...fadeUp()}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-amber-100 mb-6">
              <PawPrint className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-600">Our Story</span>
            </div>
          </motion.div>

          <motion.h1 {...fadeUp(0.1)} className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Enhancing the Bond{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Between You & Your Pet
            </span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
            PawPal is a location-based pet life platform for young pet owners in Europe. Starting from the high-frequency
            scenario of dog walking, we combine gamified maps, reward systems, NFC safety tags, AI assistance,
            and local community — helping owners care for their pets more intelligently, securely, and connectedly.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-wrap justify-center gap-6">
            {[
              { value: "58%", label: "Belgian Pet Households" },
              { value: "€122/mo", label: "Avg. Pet Spending" },
              { value: "2M+", label: "Dogs in Belgium" },
              { value: "5", label: "Languages" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== MISSION STATEMENT ===== */}
      <section className="py-16 bg-white/60 border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div {...fadeUp()}>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-snug">
              &ldquo;PawPal&apos;s mission is not to replace companionship with technology, but to{" "}
              <span className="text-amber-500">enhance</span> the bond between humans and their pets
              through smart tools.&rdquo;
            </p>
            <p className="text-sm text-gray-400 mt-4 font-medium">— PawPal Founding Team · Ghent, Belgium</p>
          </motion.div>
        </div>
      </section>

      {/* ===== PRODUCT ECOSYSTEM ===== */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">The PawPal Ecosystem</h2>
          <p className="text-gray-500 max-w-xl mx-auto">App + Web + Hardware — three products, one mission: enhance every moment with your pet.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ECOSYSTEM.map((item, i) => (
            <motion.div key={i} {...fadeUp(i * 0.08)}
              className={`bg-white rounded-2xl border ${item.border} p-7 hover:shadow-lg transition-all group`}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.color} mb-5 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== VALUES ===== */}
      <section className="py-20 bg-gradient-to-b from-amber-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">What We Stand For</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Our values guide every decision — from the features we build to the community we grow.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map((v, i) => (
              <motion.div key={i} {...fadeUp(i * 0.06)}
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 hover:border-amber-200 transition-all">
                <v.icon className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="text-base font-bold text-gray-800 mb-1">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TEAM ===== */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Meet the Founding Team</h2>
          <p className="text-gray-500 max-w-lg mx-auto">A cross-disciplinary trio from Ghent — engineering, business, and design — united by a shared love for pets.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEAM.map((member, i) => (
            <motion.div key={i} {...fadeUp(i * 0.1)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
              {/* Gradient header with photo */}
              <div className={`h-28 bg-gradient-to-r ${member.color} relative flex items-end justify-center`}>
                <div className="absolute -bottom-10 w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-md">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="px-6 pt-12 pb-6 text-center">
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-xs text-gray-400 mb-1">{member.nameCn}</p>
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-3">{member.role}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{member.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Team strengths */}
        <motion.div {...fadeUp(0.3)} className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🎓", text: "GIS PhD × LBS Product" },
            { icon: "⚡", text: "52 DB Migrations Shipped" },
            { icon: "🌍", text: "5 Languages Ready" },
            { icon: "🇧🇪", text: "Rooted in Ghent" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50/60 border border-amber-100/50">
              <span className="text-lg">{s.icon}</span>
              <span className="text-xs font-semibold text-gray-700">{s.text}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="py-20 bg-white/60 border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Our Journey</h2>
            <p className="text-gray-500">From a spark of an idea to a production-ready platform.</p>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-amber-200 md:left-1/2 md:-translate-x-0.5" />

            {TIMELINE.map((item, i) => (
              <motion.div key={i} {...fadeUp(i * 0.08)} className={`relative flex items-start gap-4 mb-8 md:mb-10 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                {/* Dot */}
                <div className="w-9 h-9 rounded-full bg-amber-500 border-4 border-amber-100 flex items-center justify-center shrink-0 z-10 md:absolute md:left-1/2 md:-translate-x-1/2">
                  <PawPrint className="w-3.5 h-3.5 text-white" />
                </div>
                {/* Card */}
                <div className={`flex-1 bg-white rounded-xl border border-gray-100 p-4 shadow-sm md:max-w-[45%] ${i % 2 === 0 ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"}`}>
                  <span className="text-xs font-extrabold text-amber-500 uppercase tracking-wider">{item.year}</span>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Join the PawPal Journey
            </h2>
            <p className="text-gray-500 mb-8 text-lg max-w-lg mx-auto">
              We&apos;re building the platform we wished existed — for every dog owner, cat lover, and pet parent who believes technology should strengthen, not replace, the bond with their best friend.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:-translate-y-0.5">
                Download App <ArrowRight className="w-5 h-5" />
              </button>
              <Link href="/globe"
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-amber-700 px-8 py-4 rounded-full font-bold text-lg transition-all border border-amber-200">
                Explore Globe
              </Link>
            </div>
          </motion.div>

          {/* Contact line */}
          <motion.div {...fadeUp(0.2)} className="mt-12 flex items-center justify-center gap-2 text-gray-400">
            <Mail className="w-4 h-4" />
            <span className="text-sm">Questions? Reach us at <a href="mailto:hello@pawpal.be" className="text-amber-500 font-semibold hover:underline">hello@pawpal.be</a></span>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
