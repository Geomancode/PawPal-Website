"use client";

import { motion } from "framer-motion";
import {
  Globe, Heart, Shield, Users, MapPin, Sparkles, Nfc, PawPrint,
  Smartphone, Search, Camera, Award, ArrowRight, Mail,
} from "lucide-react";
import Link from "next/link";

/* ── Animation helpers ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay },
});

/* ── Team Data ── */
const TEAM = [
  {
    name: "Sean Li",
    role: "CEO & Product",
    emoji: "🧑‍💼",
    color: "from-amber-400 to-orange-500",
    quote: "Every pet deserves to be found, loved, and connected.",
  },
  {
    name: "Thomas Vermeersch",
    role: "CTO & Engineering",
    emoji: "👨‍💻",
    color: "from-blue-400 to-indigo-500",
    quote: "Technology should bring pets and people closer together.",
  },
  {
    name: "Emma De Vos",
    role: "Design & Community",
    emoji: "🎨",
    color: "from-emerald-400 to-teal-500",
    quote: "Great design means a better life for pets and their humans.",
  },
];

/* ── Product Ecosystem ── */
const ECOSYSTEM = [
  {
    icon: Smartphone,
    title: "PawPal App",
    desc: "Your pet's digital identity, AI breed recognition, NFC tag enrollment, nearby missions, and community — all in your pocket.",
    color: "bg-amber-50 text-amber-500",
    border: "border-amber-100",
  },
  {
    icon: Globe,
    title: "PawPal Globe",
    desc: "An interactive 3D map showing real-time pet missions, pet-friendly places, AI-powered search, and global community activity.",
    color: "bg-blue-50 text-blue-500",
    border: "border-blue-100",
  },
  {
    icon: Nfc,
    title: "PawPal NFC Tags",
    desc: "Programmable NFC pet tags that link to your pet's public profile. Anyone can scan to see medical info, contact details, and more.",
    color: "bg-emerald-50 text-emerald-500",
    border: "border-emerald-100",
  },
];

/* ── Values ── */
const VALUES = [
  { icon: Heart, title: "Love First", desc: "Every feature we build starts with one question: does this make life better for pets and their humans?" },
  { icon: Shield, title: "Safety & Trust", desc: "Verified users, trust levels, and AI-powered moderation keep our community safe for everyone." },
  { icon: Users, title: "Community-Driven", desc: "PawPal is built by and for pet lovers. Your feedback shapes every update and new feature." },
  { icon: Sparkles, title: "Smart Technology", desc: "AI identification, NFC tags, real-time maps — we use cutting-edge tech to solve real-world pet problems." },
  { icon: MapPin, title: "Locally Rooted", desc: "Born in Ghent, Belgium. We believe in strong local communities that connect neighbors through their pets." },
  { icon: PawPrint, title: "Every Animal Matters", desc: "From dogs and cats to rabbits and reptiles — PawPal is a home for every species and every breed." },
];

/* ── Timeline ── */
const TIMELINE = [
  { year: "2024", event: "The idea is born — three pet lovers in Belgium imagine a better way to connect pet owners." },
  { year: "2025 Q1", event: "PawPal app prototype: pet profiles, AI breed ID, and the interactive Globe map go live." },
  { year: "2025 Q2", event: "NFC pet tags launch — scan a tag, see a pet's profile instantly. The first IoT + pet welfare bridge." },
  { year: "2025 H2", event: "Community features, pet adoption marketplace, and multi-language support roll out globally." },
  { year: "2026+", event: "Hardware partnerships, veterinary integrations, global expansion — and much more to come." },
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
            Your Pet&apos;s Life,{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Reimagined
            </span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
            PawPal is the companion platform for pet owners everywhere. We combine AI, IoT, and community
            to create a world where every pet is safe, known, and loved — and every owner has the tools
            to give their best friend the best life.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-wrap justify-center gap-6">
            {[
              { value: "10K+", label: "Pet Lovers" },
              { value: "50+", label: "Countries" },
              { value: "5K+", label: "Missions" },
              { value: "12", label: "Species Supported" },
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
              &ldquo;We believe that technology should serve the bond between humans and animals
              — not replace it, but <span className="text-amber-500">strengthen</span> it.&rdquo;
            </p>
            <p className="text-sm text-gray-400 mt-4 font-medium">— The PawPal Team</p>
          </motion.div>
        </div>
      </section>

      {/* ===== PRODUCT ECOSYSTEM ===== */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">The PawPal Ecosystem</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Three products, one mission: connect every pet with the care and community they deserve.</p>
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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Meet the Pack</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Three pet lovers from Belgium who decided to build the platform they wished existed.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEAM.map((member, i) => (
            <motion.div key={i} {...fadeUp(i * 0.1)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
              {/* Gradient header */}
              <div className={`h-24 bg-gradient-to-r ${member.color} relative flex items-center justify-center`}>
                <span className="text-5xl drop-shadow-sm group-hover:scale-110 transition-transform">{member.emoji}</span>
              </div>
              <div className="px-6 py-5">
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-3">{member.role}</p>
                <p className="text-sm text-gray-500 italic leading-relaxed">&ldquo;{member.quote}&rdquo;</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="py-20 bg-white/60 border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Our Journey</h2>
            <p className="text-gray-500">From a spark of an idea to a global platform for pet lovers.</p>
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
              Join the PawPal Family
            </h2>
            <p className="text-gray-500 mb-8 text-lg max-w-lg mx-auto">
              Whether you have a dog, cat, rabbit, or reptile — PawPal is your companion for every paw, claw, and fin.
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
