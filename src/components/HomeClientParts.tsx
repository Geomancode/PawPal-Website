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
  const line1 = "Every Pet Deserves a";
  const line1Words = line1.split(" ");
  const line2 = "Connected Life";
  const line2Words = line2.split(" ");
  let wordIndex = 0;

  return (
    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight text-[#2D3748] font-brand">
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

function parseStatValue(value: string): { num: number; suffix: string } {
  const match = value.match(/^([\d.]+)(.*)$/);
  if (match) return { num: parseFloat(match[1]), suffix: match[2] };
  return { num: 0, suffix: value };
}

export function AnimatedCounter({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { num, suffix } = parseStatValue(value);
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
          <>{num % 1 === 0 ? displayNum : displayNum.toFixed(1)}{suffix}</>
        ) : (
          <>0{suffix}</>
        )}
      </div>
      <div className="text-sm text-[#64748B] mt-1 font-medium">{label}</div>
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
      <div className="absolute top-[-8%] left-[-8%] w-[40%] h-[40%] rounded-full bg-[#F59E0B]/15 blur-[120px] blob-animate-1" />
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
        className="flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#E8930A] text-white px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.5)]"
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
    { icon: MapPin, color: "text-[#F59E0B]", label: "Live Missions" },
    { icon: Search, color: "text-[#10B981]", label: "AI Pet ID" },
    { icon: ShieldCheck, color: "text-[#4A90D9]", label: "Safe Network" },
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
          className="flex items-center gap-2 text-[#64748B]"
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
        Drag to spin · Click a label to explore
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
          className="bg-[#F59E0B] hover:bg-[#E8930A] text-white px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-[0_4px_20px_rgba(245,158,11,0.35)]"
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
      {/* Card 1: Global Map — Large spanning 2 rows */}
      <SpotlightCard className="glass rounded-2xl border border-gray-100 hover:border-[#4A90D9]/30 transition-all duration-300 hover:shadow-xl group cursor-default bento-glow lg:row-span-2 p-8 flex flex-col justify-between">
        <div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#4A90D9]/10 text-[#4A90D9] mb-5 group-hover:scale-110 transition-transform duration-300">
            <GlobeIcon className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-[#2D3748] mb-3">Global Map</h3>
          <p className="text-[#64748B] text-sm leading-relaxed">
            See live missions around the world on our interactive 3D globe. Track pet activities, find nearby shelters, and discover rescue events in real-time.
          </p>
        </div>
        {/* Mini globe visual */}
        <div className="mt-6 relative h-32 rounded-xl bg-gradient-to-br from-[#4A90D9]/5 to-[#10B981]/5 overflow-hidden flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4A90D9]/20 to-[#10B981]/10 blob-animate-2 flex items-center justify-center">
            <GlobeIcon className="w-10 h-10 text-[#4A90D9]/40" />
          </div>
          {/* Floating dots */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-[#F59E0B]/60 blob-animate-1"
              style={{
                top: `${20 + i * 15}%`,
                left: `${15 + i * 18}%`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}
        </div>
      </SpotlightCard>

      {/* Card 2: Adopt & Rescue */}
      <SpotlightCard className="glass rounded-2xl border border-gray-100 hover:border-rose-200 transition-all duration-300 hover:shadow-xl group cursor-default bento-glow p-7 flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-50 text-rose-500 mb-4 group-hover:scale-110 transition-transform duration-300">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#2D3748] mb-2">Adopt & Rescue</h3>
          <p className="text-[#64748B] text-sm leading-relaxed">
            Find pets near you who need a loving home. Every click saves a life.
          </p>
        </div>
        {/* Mini heart badges */}
        <div className="flex gap-2 mt-4">
          {["🐕", "🐈", "🐇"].map((e, i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-lg hover:scale-110 transition-transform">
              {e}
            </div>
          ))}
        </div>
      </SpotlightCard>

      {/* Card 3: Community */}
      <SpotlightCard className="glass rounded-2xl border border-gray-100 hover:border-[#10B981]/30 transition-all duration-300 hover:shadow-xl group cursor-default bento-glow p-7 flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#10B981]/10 text-[#10B981] mb-4 group-hover:scale-110 transition-transform duration-300">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#2D3748] mb-2">Community</h3>
          <p className="text-[#64748B] text-sm leading-relaxed">
            Connect with local pet owners, walkers, and sitters in your area.
          </p>
        </div>
        {/* User stack */}
        <div className="flex -space-x-2 mt-4">
          {["#4A90D9", "#F59E0B", "#10B981", "#F97316", "#E11D48"].map((c, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: c, zIndex: 5 - i }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
          <div className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[#64748B] text-xs font-bold" style={{ zIndex: 0 }}>
            +2K
          </div>
        </div>
      </SpotlightCard>

      {/* Card 4: AI Pet ID — wide spanning 2 cols */}
      <SpotlightCard className="glass rounded-2xl border border-gray-100 hover:border-[#F59E0B]/30 transition-all duration-300 hover:shadow-xl group cursor-default bento-glow lg:col-span-2 p-7 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#F59E0B]/10 text-[#F59E0B] mb-4 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#2D3748] mb-2">AI Pet ID</h3>
          <p className="text-[#64748B] text-sm leading-relaxed">
            Point your camera at any animal and let our AI identify breed, age, health status and more. Powered by Google Gemini.
          </p>
        </div>
        {/* AI scan visual */}
        <div className="w-full md:w-48 h-28 rounded-xl bg-gradient-to-br from-[#F59E0B]/5 to-[#4A90D9]/5 flex items-center justify-center relative overflow-hidden">
          <div className="text-4xl">🐕</div>
          {/* Scanning line */}
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/60 to-transparent blob-animate-1" style={{ top: "50%" }} />
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#10B981]/15 text-[#10B981] text-[10px] font-bold rounded-full">
            98% match
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 2 — Effect #7: Trust Marquee (infinite scroll)
   ═══════════════════════════════════════════════════════════════ */

const TRUST_ITEMS = [
  { emoji: "🌍", label: "Global Coverage" },
  { emoji: "🔒", label: "End-to-End Encrypted" },
  { emoji: "🤖", label: "Powered by Gemini AI" },
  { emoji: "📡", label: "Real-Time GPS Tracking" },
  { emoji: "🏥", label: "Vet Network Partner" },
  { emoji: "🐾", label: "10,000+ Pet Lovers" },
  { emoji: "⚡", label: "NFC Smart Tags" },
  { emoji: "🏆", label: "Award-Winning Design" },
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
            <span className="text-sm font-medium text-[#2D3748]">{item.label}</span>
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
  return (
    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
      {/* Left: Text */}
      <FadeInView className="flex-1 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4A90D9]/8 text-[#4A90D9] text-sm font-medium">
          <Smartphone className="w-4 h-4" />
          Available on iOS & Android
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-[#2D3748] font-brand">
          Your Pet's World,{" "}
          <span className="text-gradient-animated">In Your Pocket</span>
        </h2>
        <p className="text-[#64748B] text-lg leading-relaxed max-w-md">
          Track walks, discover missions, connect with your community, and keep your pet's health records — all in one beautiful app.
        </p>
        <div className="space-y-3">
          {[
            { icon: MapPin, text: "Real-time walk tracking with route history", color: "text-[#F59E0B]" },
            { icon: ShieldCheck, text: "NFC smart tags for instant pet profiles", color: "text-[#4A90D9]" },
            { icon: Sparkles, text: "AI-powered breed & health analysis", color: "text-[#10B981]" },
          ].map((f, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 text-[#2D3748]"
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <f.icon className={`w-5 h-5 ${f.color} shrink-0`} />
              <span className="text-sm">{f.text}</span>
            </motion.div>
          ))}
        </div>
      </FadeInView>

      {/* Right: Phone mockups */}
      <FadeInView delay={0.2} className="relative">
        <div className="flex gap-5 items-center">
          {/* Phone 1 — primary */}
          <motion.div
            className="phone-mockup"
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="w-full h-full bg-gradient-to-b from-[#4A90D9]/10 via-[#FFFDF9] to-[#F59E0B]/10 flex flex-col items-center justify-center gap-3 p-6">
              <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/15 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-[#F59E0B]" />
              </div>
              <div className="text-[#2D3748] font-bold text-sm">Walk Mode</div>
              <div className="w-full h-24 rounded-xl bg-[#4A90D9]/5 mt-2 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#4A90D9]/10 blob-animate-2 flex items-center justify-center">
                  <GlobeIcon className="w-8 h-8 text-[#4A90D9]/40" />
                </div>
              </div>
              <div className="flex gap-2 mt-2 w-full">
                <div className="flex-1 h-8 rounded-lg bg-[#10B981]/10" />
                <div className="flex-1 h-8 rounded-lg bg-[#F59E0B]/10" />
              </div>
              <div className="w-full h-6 rounded-lg bg-gray-100 mt-1" />
              <div className="w-3/4 h-6 rounded-lg bg-gray-50" />
            </div>
          </motion.div>

          {/* Phone 2 — offset */}
          <motion.div
            className="phone-mockup hidden md:block"
            style={{ marginTop: "40px" }}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="w-full h-full bg-gradient-to-b from-[#F59E0B]/10 via-[#FFFDF9] to-[#10B981]/10 flex flex-col items-center justify-center gap-3 p-6">
              <div className="w-16 h-16 rounded-2xl bg-[#10B981]/15 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#10B981]" />
              </div>
              <div className="text-[#2D3748] font-bold text-sm">AI Pet ID</div>
              <div className="w-full h-28 rounded-xl bg-[#F59E0B]/5 mt-2 flex items-center justify-center text-3xl">
                🐕
              </div>
              <div className="w-full px-3 py-2 rounded-lg bg-[#10B981]/8 text-[#10B981] text-xs font-medium text-center">
                Golden Retriever · 98% match
              </div>
              <div className="w-full h-6 rounded-lg bg-gray-100 mt-1" />
              <div className="w-2/3 h-6 rounded-lg bg-gray-50" />
            </div>
          </motion.div>
        </div>

        {/* Floating badges around phones */}
        <motion.div
          className="absolute -top-4 -left-6 px-3 py-1.5 rounded-full bg-white shadow-lg border border-gray-100 text-xs font-medium text-[#2D3748] flex items-center gap-1.5"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          GPS Active
        </motion.div>
        <motion.div
          className="absolute -bottom-2 -right-4 px-3 py-1.5 rounded-full bg-white shadow-lg border border-gray-100 text-xs font-medium text-[#2D3748] flex items-center gap-1.5"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          🐾 3.2km walked
        </motion.div>
      </FadeInView>
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

