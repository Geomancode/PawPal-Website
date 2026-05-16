"use client";

import { motion, useMotionValue, useTransform, useSpring, useScroll, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import Globe from "@/components/Globe";
import { ArrowRight, MapPin, Search, ShieldCheck } from "lucide-react";
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
      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="bg-[#F59E0B] hover:bg-[#E8930A] text-white px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-[0_4px_20px_rgba(245,158,11,0.35)]"
      >
        Get PawPal Free
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/globe")}
        className="glass hover:bg-white/70 text-[#4A90D9] px-8 py-4 rounded-full font-bold text-lg transition-colors border border-[#4A90D9]/20 hover:border-[#4A90D9]/40"
      >
        Explore the Globe →
      </motion.button>
    </div>
  );
}
