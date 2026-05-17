"use client";

import { motion, useMotionValue, useTransform, useSpring, useScroll, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import Globe from "@/components/Globe";
import { ArrowRight, MapPin, Search, ShieldCheck, Heart, Globe as GlobeIcon, Users, Sparkles, Smartphone } from "lucide-react";
import { ReactNode, useRef, useEffect, useState, useCallback, MouseEvent as ReactMouseEvent } from "react";

/* ═══════════════════════════════════════════════════════════════
   PHASE 1 — Effect #1: Animated Text Reveal (word-by-word)
   ═══════════════════════════════════════════════════════════════ */

const wordVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.3 + i * 0.08,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

export function AnimatedHeadline() {
  const line1 = "Every Moment with Your Pet,";
  const line1Words = line1.split(" ");
  const line2 = "Made Smarter";
  const line2Words = line2.split(" ");
  let wordIndex = 0;

  return (
    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight text-[#1E293B] font-brand">
      {line1Words.map((word, i) => (
        <motion.span
          key={`l1-${i}`}
          custom={wordIndex++}
          initial="hidden"
          animate="visible"
          variants={wordVariants}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
      <br className="hidden lg:block" />
      {line2Words.map((word, i) => {
        const idx = wordIndex++;
        return (
          <motion.span
            key={`l2-${i}`}
            custom={idx}
            initial="hidden"
            animate="visible"
            variants={wordVariants}
            className="inline-block mr-[0.3em] text-gradient-animated"
          >
            {word}
          </motion.span>
        );
      })}
    </h1>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 1 — Effect #2: Animated Counter (count up on scroll)
   ═══════════════════════════════════════════════════════════════ */

function parseStatValue(value: string): { prefix: string; num: number; suffix: string } {
  const match = value.match(/^([^\d]*)([\d.]+)(.*)$/);
  if (match) return { prefix: match[1], num: parseFloat(match[2]), suffix: match[3] };
  return { prefix: "", num: 0, suffix: value };
}

export function AnimatedCounter({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { prefix, num, suffix } = parseStatValue(value);
  const [displayNum, setDisplayNum] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1800; // ms
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayNum(Math.floor(eased * num));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, num]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative"
    >
      <div className="text-3xl md:text-4xl font-extrabold text-gradient-animated font-brand tabular-nums">
        {isInView ? (
          <>{prefix}{num % 1 === 0 ? displayNum : displayNum.toFixed(1)}{suffix}</>
        ) : (
          <>{prefix}0{suffix}</>
        )}
      </div>
      <div className="text-sm text-[#6B7B8D] mt-1 font-medium">{label}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 1 — Effect #3: Spotlight Card (cursor-following glow)
   ═══════════════════════════════════════════════════════════════ */

export function SpotlightCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Spotlight gradient overlay */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(400px circle at ${x}px ${y}px, rgba(74, 144, 217, 0.08), transparent 60%)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 1 — Effect #4: Scroll Progress Bar
   ═══════════════════════════════════════════════════════════════ */

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 1 — Effect #5: Breathing Background Blobs
   ═══════════════════════════════════════════════════════════════ */

export function HeroBlobs() {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
      {/* Amber blob — top left */}
      <div className="absolute top-[-8%] left-[-8%] w-[40%] h-[40%] rounded-full bg-[#F5A623]/15 blur-[120px] blob-animate-1" />
      {/* Blue blob — bottom right */}
      <div className="absolute bottom-[-8%] right-[-8%] w-[35%] h-[35%] rounded-full bg-[#4A90D9]/12 blur-[120px] blob-animate-2" />
      {/* Emerald blob — center (very subtle) */}
      <div className="absolute top-[40%] left-[50%] w-[25%] h-[25%] rounded-full bg-[#10B981]/6 blur-[100px] blob-animate-3" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Existing components — Updated with brand enhancements
   ═══════════════════════════════════════════════════════════════ */

/* ── Animated wrapper (client-only) ── */
export function FadeIn({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInView({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Hero CTA buttons — with hover micro-animation ── */
export function HeroCTA() {
  const router = useRouter();
  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-4 pt-2"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.6 }}
    >
      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#E8930A] text-white px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.5)]"
      >
        Download App
        <ArrowRight className="w-5 h-5" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/globe")}
        className="flex items-center justify-center gap-2 glass hover:bg-white/70 text-[#4A90D9] px-8 py-4 rounded-full font-bold text-lg transition-colors border border-[#4A90D9]/20 hover:border-[#4A90D9]/40"
      >
        Explore Globe
      </motion.button>
    </motion.div>
  );
}

/* ── Hero trust badges — staggered entry ── */
export function HeroBadges() {
  const badges = [
    { icon: MapPin, color: "text-[#F5A623]", label: "Gamified Walks" },
    { icon: Search, color: "text-[#10B981]", label: "AI Pet Assistant" },
    { icon: ShieldCheck, color: "text-[#4A90D9]", label: "NFC Safety Tags" },
  ];

  return (
    <motion.div
      className="flex items-center gap-8 pt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.3, duration: 0.6 }}
    >
      {badges.map((t, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2 text-[#6B7B8D]"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.4 + i * 0.12 }}
        >
          <t.icon className={`w-5 h-5 ${t.color}`} />
          <span className="text-sm font-medium">{t.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ── Globe section with animation ── */
export function GlobeSection() {
  return (
    <motion.div
      className="w-full lg:w-1/2 flex justify-center items-center h-[420px] lg:h-[700px] relative"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <Globe />
      </div>
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 glass px-4 py-1.5 rounded-full text-xs text-[#4A90D9] pointer-events-none font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0.6, 1] }}
        transition={{ delay: 1.5, duration: 3, repeat: Infinity, repeatDelay: 4 }}
      >
        Drag to spin · Click to explore
      </motion.div>
    </motion.div>
  );
}

/* ── Bottom CTA section — with hover animations ── */
export function BottomCTA() {
  const router = useRouter();
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <MagneticButton>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="bg-[#F5A623] hover:bg-[#E8930A] text-white px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-[0_4px_20px_rgba(245,158,11,0.35)]"
        >
          Get PawPal Free
        </motion.button>
      </MagneticButton>
      <MagneticButton>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/globe")}
          className="glass hover:bg-white/70 text-[#4A90D9] px-8 py-4 rounded-full font-bold text-lg transition-colors border border-[#4A90D9]/20 hover:border-[#4A90D9]/40"
        >
          Explore the Globe →
        </motion.button>
      </MagneticButton>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 2 — Effect #6: Bento Feature Grid
   ═══════════════════════════════════════════════════════════════ */

export function BentoFeatureGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-[minmax(180px,auto)]">
      {/* Card 1: Fog-of-War Map — the #1 differentiator, spanning 2 rows */}
      <SpotlightCard className="glass rounded-2xl border border-gray-100 hover:border-[#4A90D9]/30 transition-all duration-300 hover:shadow-xl group cursor-default bento-glow lg:row-span-2 p-8 flex flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4A90D9]/8 text-[10px] font-bold text-[#4A90D9] uppercase tracking-wider mb-4">Solo Mode</div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#4A90D9]/10 text-[#4A90D9] mb-5 group-hover:scale-110 transition-transform duration-300">
            <GlobeIcon className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-[#1E293B] mb-3">Fog-of-War Map</h3>
          <p className="text-[#6B7B8D] text-sm leading-relaxed">
            Your city is hidden under fog. Every walk reveals new hexagonal tiles on the map. Explore parks, streets, and neighborhoods to uncover your world — one step at a time.
          </p>
        </div>
        {/* Hex grid visual */}
        <div className="mt-6 relative h-32 rounded-xl bg-gradient-to-br from-[#4A90D9]/5 to-[#10B981]/5 overflow-hidden flex items-center justify-center">
          <div className="grid grid-cols-5 gap-1">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-sm transition-all duration-500 ${
                  i % 3 === 0 ? "bg-[#F5A623]/30" : i % 4 === 0 ? "bg-[#4A90D9]/20" : "bg-[#1E293B]/8"
                }`}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <div className="absolute bottom-2 right-3 text-[10px] font-bold text-[#4A90D9]/60">H3 Hex Grid</div>
        </div>
      </SpotlightCard>

      {/* Card 2: NFC Safety Tags — cold-start product */}
      <SpotlightCard className="glass rounded-2xl border border-gray-100 hover:border-[#F5A623]/30 transition-all duration-300 hover:shadow-xl group cursor-default bento-glow p-7 flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#F5A623]/10 text-[#F5A623] mb-4 group-hover:scale-110 transition-transform duration-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#1E293B] mb-2">NFC Safety Tags</h3>
          <p className="text-[#6B7B8D] text-sm leading-relaxed">
            €19 smart tags replace static dog tags. Anyone can scan to see your pet&apos;s profile — no app needed. Privacy-first: owner info hidden until lost mode.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-[#F5A623]/5 text-[#F5A623] text-xs font-medium">
          ⚡ Scan → pawpal.be/tag — zero-download rescue
        </div>
      </SpotlightCard>

      {/* Card 3: Local Community */}
      <SpotlightCard className="glass rounded-2xl border border-gray-100 hover:border-[#10B981]/30 transition-all duration-300 hover:shadow-xl group cursor-default bento-glow p-7 flex flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/8 text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-4">Community Mode</div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#10B981]/10 text-[#10B981] mb-4 group-hover:scale-110 transition-transform duration-300">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#1E293B] mb-2">Local Pet Network</h3>
          <p className="text-[#6B7B8D] text-sm leading-relaxed">
            Find nearby dog walkers, request help, share lost-pet alerts, and build trust through verified interactions in your neighborhood.
          </p>
        </div>
        {/* User stack */}
        <div className="flex -space-x-2 mt-4">
          {["#4A90D9", "#F5A623", "#10B981", "#F97316", "#E11D48"].map((c, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: c, zIndex: 5 - i }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
      </SpotlightCard>

      {/* Card 4: PawPoints + AI — wide spanning 2 cols */}
      <SpotlightCard className="glass rounded-2xl border border-gray-100 hover:border-[#F5A623]/30 transition-all duration-300 hover:shadow-xl group cursor-default bento-glow lg:col-span-2 p-7 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#F5A623]/10 text-[#F5A623] mb-4 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#1E293B] mb-2">PawPoints & AI Assistant</h3>
          <p className="text-[#6B7B8D] text-sm leading-relaxed">
            Earn points for every walk, exploration, and community contribution. Redeem for real products and Premium perks. Plus, AI-powered breed ID, behavior tips, and care advice — powered by Gemini.
          </p>
        </div>
        {/* Points visual */}
        <div className="w-full md:w-48 h-28 rounded-xl bg-gradient-to-br from-[#F5A623]/5 to-[#4A90D9]/5 flex flex-col items-center justify-center relative overflow-hidden gap-1">
          <div className="text-2xl">🏆</div>
          <div className="text-lg font-bold text-[#F5A623]">+150 pts</div>
          <div className="text-[10px] text-[#6B7B8D]">Daily walk completed!</div>
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F5A623]/40 to-transparent blob-animate-1" style={{ bottom: "20%" }} />
        </div>
      </SpotlightCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 2 — Effect #7: Trust Marquee (infinite scroll)
   ═══════════════════════════════════════════════════════════════ */

const TRUST_ITEMS = [
  { emoji: "🇧🇪", label: "Born in Ghent, Belgium" },
  { emoji: "🔒", label: "GDPR-First Design" },
  { emoji: "🤖", label: "Powered by Gemini AI" },
  { emoji: "📡", label: "Real-Time GPS Tracking" },
  { emoji: "🗺️", label: "Fog-of-War Map Engine" },
  { emoji: "🐾", label: "PawPoints Rewards" },
  { emoji: "⚡", label: "NFC Smart Tags" },
  { emoji: "🌍", label: "5 Languages Supported" },
];

export function TrustMarquee() {
  return (
    <div className="relative overflow-hidden py-6">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#FFFDF9] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#FFFDF9] to-transparent z-10" />

      <div className="flex marquee-track" style={{ width: "max-content" }}>
        {/* Duplicate items for seamless loop */}
        {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-6 py-3 mx-2 rounded-full glass border border-gray-100 hover:border-[#4A90D9]/20 transition-all hover:shadow-sm whitespace-nowrap"
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="text-sm font-medium text-[#1E293B]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 2 — Effect #8: App Screenshot Showcase
   ═══════════════════════════════════════════════════════════════ */

export function AppShowcase() {
  const features = [
    { icon: MapPin, title: "Walk Tracking", desc: "Fog-of-war maps & gamified routes", color: "bg-[#F5A623]/12 text-[#F5A623]" },
    { icon: ShieldCheck, title: "NFC Safety Tags", desc: "Instant pet profiles for finders", color: "bg-[#4A90D9]/12 text-[#4A90D9]" },
    { icon: Sparkles, title: "AI Assistant", desc: "Breed analysis & health insights", color: "bg-[#10B981]/12 text-[#10B981]" },
    { icon: Users, title: "Community", desc: "Local pet lovers & mutual help", color: "bg-[#E8824C]/12 text-[#E8824C]" },
  ];

  const thoughtfulFeatures = [
    {
      title: "Walk & Explore",
      desc: "Gamified walks with fog-of-war maps, real-time tracking, route history, and PawPoints rewards. Every step counts!",
      mockups: ["/images/mockup-walk.png", "/images/app-mockup.png"],
      color: "from-[#F5A623]",
      iconColor: "text-[#F5A623]",
      bgColor: "bg-[#F5A623]/5",
      borderColor: "border-[#F5A623]/20",
    },
    {
      title: "Smart Safety",
      desc: "NFC tags turn any collar into a smart ID. Finders scan — no app needed — and instantly see your pet's profile and your contact info.",
      mockups: ["/images/mockup-nfc.png", "/images/mockup-profile.png"],
      color: "from-[#4A90D9]",
      iconColor: "text-[#4A90D9]",
      bgColor: "bg-[#4A90D9]/5",
      borderColor: "border-[#4A90D9]/20",
    },
    {
      title: "AI & Community",
      desc: "AI-powered breed ID, health advice, and behavior analysis. Plus a trusted local network of pet lovers for walks, sitting, and emergencies.",
      mockups: ["/images/mockup-ai.png", "/images/mockup-community.png"],
      color: "from-[#10B981]",
      iconColor: "text-[#10B981]",
      bgColor: "bg-[#10B981]/5",
      borderColor: "border-[#10B981]/20",
    },
  ];

  return (
    <div className="space-y-20">
      {/* ══════ SECTION 1: Hero App Overview ══════ */}
      <FadeInView>
        <div className="relative bg-gradient-to-br from-[#FFF4E8] via-[#F9FAFB] to-[#F0F4F8] rounded-[32px] overflow-hidden border border-[#F5E6D3]/40 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
          {/* Decorative sparkle elements */}
          <svg className="absolute top-6 left-8 w-10 h-10 text-[#F5A623]/20 hidden lg:block" viewBox="0 0 40 40" fill="none">
            <path d="M20 2v8M20 30v8M2 20h8M30 20h8M8 8l5 5M27 27l5 5M8 32l5-5M27 13l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <svg className="absolute top-12 left-20 w-5 h-5 text-[#E8824C]/25 hidden lg:block" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 0l2.5 7.5H20l-6 4.5 2.5 7.5L10 15l-6.5 4.5L6 12 0 7.5h7.5z"/>
          </svg>

          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-0">
            {/* Left: Text content */}
            <div className="flex-1 p-8 lg:p-12 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5A623]/10 text-[#E8824C] text-sm font-semibold">
                <Smartphone className="w-4 h-4" />
                Your All-in-One Pet Care Solution
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] font-brand leading-tight">
                Your Pet&apos;s World,{" "}
                <span className="text-gradient-animated">In Your Pocket</span>
              </h2>
              <p className="text-[#6B7B8D] text-lg leading-relaxed max-w-md">
                All-in-one app for pet safety, gamified walks, health logging, and community connection. Available on iOS & Android.
              </p>

              {/* Feature chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 hover:shadow-md transition-all"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                  >
                    <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center shrink-0`}>
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#1E293B]">{f.title}</div>
                      <div className="text-xs text-[#6B7B8D]">{f.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Download CTA */}
              <div className="flex gap-3 pt-2">
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F5A623] hover:bg-[#E8824C] text-white font-bold text-sm transition-colors shadow-lg shadow-[#F5A623]/20"
                >
                  <Smartphone className="w-4 h-4" /> Download App
                </motion.a>
                <motion.a
                  href="/about"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-[#F5E6D3] text-[#1E293B] font-bold text-sm hover:border-[#F5A623] transition-colors"
                >
                  Learn More
                </motion.a>
              </div>
            </div>

            {/* Right: App mockup image */}
            <div className="relative flex-1 flex items-center justify-center p-4 lg:p-8">
              <motion.div
                className="relative z-10"
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <img
                  src="/images/app-mockup.png"
                  alt="PawPal App Interface"
                  className="w-[260px] lg:w-[300px] drop-shadow-2xl"
                />
              </motion.div>

              {/* Floating badges */}
              <motion.div
                className="absolute top-8 right-4 lg:right-8 px-3 py-2 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg border border-[#F5E6D3]/60 text-xs font-semibold text-[#1E293B] flex items-center gap-2 z-20"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                GPS Active
              </motion.div>
              <motion.div
                className="absolute bottom-12 left-2 lg:left-4 px-3 py-2 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg border border-[#F5E6D3]/60 text-xs font-semibold text-[#1E293B] flex items-center gap-2 z-20"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                🐾 3.2km walked today
              </motion.div>
            </div>
          </div>
        </div>
      </FadeInView>

      {/* ══════ SECTION 2: 3 Powerful Features — PawView-inspired ══════ */}
      <div>
        <FadeInView>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] font-brand mb-3">
              3 Powerful Features
            </h2>
            <p className="text-[#6B7B8D] max-w-lg mx-auto">
              That make pet life smarter, safer, and more fun
            </p>
          </div>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {thoughtfulFeatures.map((feature, i) => (
            <FadeInView key={i} delay={i * 0.15}>
              <div className={`relative rounded-[28px] ${feature.bgColor} border ${feature.borderColor} p-6 pb-4 overflow-hidden h-full flex flex-col`}>
                {/* Phone mockups */}
                <div className="flex justify-center gap-3 mb-6">
                  {feature.mockups.map((src, j) => (
                    <motion.img
                      key={j}
                      src={src}
                      alt={`${feature.title} screenshot ${j + 1}`}
                      className="w-[120px] md:w-[110px] lg:w-[130px] rounded-2xl shadow-lg object-contain"
                      style={{ marginTop: j % 2 === 1 ? "16px" : "0px" }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: j % 2 === 1 ? 16 : 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + j * 0.1 }}
                      whileHover={{ y: (j % 2 === 1 ? 16 : 0) - 6, scale: 1.03 }}
                    />
                  ))}
                </div>

                {/* Text */}
                <div className="text-center mt-auto">
                  <h3 className="text-lg font-bold text-[#1E293B] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#6B7B8D] leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 3 — Effect #11: Floating Particles
   ═══════════════════════════════════════════════════════════════ */

export function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 5.2) % 90}%`,
    size: 3 + (i % 4) * 1.5,
    delay: i * 0.8,
    duration: 6 + (i % 5) * 2,
    color: i % 3 === 0
      ? "rgba(245, 158, 11, 0.5)"
      : i % 3 === 1
        ? "rgba(74, 144, 217, 0.4)"
        : "rgba(16, 185, 129, 0.35)",
    alt: i % 2 === 0,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: `${10 + (p.id * 7) % 40}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `${p.alt ? "float-particle-alt" : "float-particle"} ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 3 — Effect #13: Magnetic Button
   ═══════════════════════════════════════════════════════════════ */

export function MagneticButton({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distX = (e.clientX - centerX) * 0.15;
    const distY = (e.clientY - centerY) * 0.15;
    x.set(distX);
    y.set(distY);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

