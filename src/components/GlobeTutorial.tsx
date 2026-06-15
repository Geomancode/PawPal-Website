"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { useAuth } from "./AuthProvider";

const STORAGE_KEY = "pawpal_globe_tutorial_done";
const INTRO_DELAY_MS = 12000;

/* ── Step definitions ── */
interface TourStep {
  targetId: string;          // DOM element id to spotlight
  title: string;
  description: string;
  emoji: string;
  position: "top" | "bottom" | "left" | "right"; // tooltip placement relative to element
}

const STEPS: TourStep[] = [
  {
    targetId: "globe-map",
    emoji: "👋",
    title: "Welcome to the Globe!",
    description: "This interactive 3D map shows real-time pet missions and pet-friendly places worldwide. Drag to spin, scroll to zoom in.",
    position: "top",
  },
  {
    targetId: "globe-search",
    emoji: "🔍",
    title: "AI-Powered Search",
    description: "Ask anything in natural language — try \"dog parks near Ghent\" or \"adoption missions\". Our AI will find and highlight results on the map!",
    position: "top",
  },
  {
    targetId: "globe-layers",
    emoji: "🗂️",
    title: "Filter Layers",
    description: "Toggle Missions (🐾 Coral accent) and Places (📍 Paw Blue) on or off. Each layer has its own markers with relevant info popups.",
    position: "left",
  },
];

/* ── Helpers ── */
function getElementRect(id: string): DOMRect | null {
  const el = document.getElementById(id);
  return el ? el.getBoundingClientRect() : null;
}

function getSpotlightClip(rect: DOMRect, padding: number = 12): string {
  const top = rect.top - padding;
  const left = rect.left - padding;
  const bottom = rect.bottom + padding;
  const right = rect.right + padding;
  const radius = 16;

  // SVG-style clip path that cuts out around the target element
  return `polygon(
    0% 0%, 0% 100%, 
    ${left}px 100%, ${left}px ${bottom}px,
    ${left + radius}px ${bottom}px, ${left}px ${bottom - radius}px,
    ${left}px ${top + radius}px, ${left + radius}px ${top}px,
    ${right - radius}px ${top}px, ${right}px ${top + radius}px,
    ${right}px ${bottom - radius}px, ${right - radius}px ${bottom}px,
    ${left}px ${bottom}px, ${left}px 100%,
    100% 100%, 100% 0%
  )`;
}

export default function GlobeTutorial() {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Decide whether to show
  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), INTRO_DELAY_MS);
    return () => clearTimeout(timer);
  }, [user, loading]);

  // Track target element position (re-measure on resize/step change)
  const measureTarget = useCallback(() => {
    const current = STEPS[step];
    if (!current) return;
    const rect = getElementRect(current.targetId);
    setTargetRect(rect);
  }, [step]);

  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(measureTarget);
    const onResize = () => measureTarget();
    window.addEventListener("resize", onResize);
    // Re-measure periodically in case of layout shifts
    const interval = setInterval(measureTarget, 500);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      clearInterval(interval);
    };
  }, [visible, step, measureTarget]);

  const dismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dismiss();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible || !targetRect) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Calculate tooltip position based on step.position
  const tooltipStyle = getTooltipPosition(current.position, targetRect);

  return (
    <>
      {/* Dark overlay with cutout around target */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998]"
        onClick={dismiss}
        style={{
          background: "rgba(0,0,0,0.38)",
          clipPath: getSpotlightClip(targetRect),
          transition: "clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Spotlight border ring around target */}
      <motion.div
        key={`ring-${step}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed z-[9999] pointer-events-none rounded-2xl"
        style={{
          top: targetRect.top - 14,
          left: targetRect.left - 14,
          width: targetRect.width + 28,
          height: targetRect.height + 28,
          border: "2px solid color-mix(in srgb, var(--color-paw-primary) 70%, transparent)",
          boxShadow: "0 0 0 4000px rgba(0,0,0,0), 0 0 20px color-mix(in srgb, var(--color-paw-primary) 35%, transparent)",
          transition: "top 0.4s, left 0.4s, width 0.4s, height 0.4s",
        }}
      >
        <div className="absolute inset-0 rounded-paw-lg border-2 border-paw-primary/40 animate-pulse" />
      </motion.div>

      {/* Tooltip card anchored near the target */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: current.position === "top" ? 20 : current.position === "bottom" ? -20 : 0, x: current.position === "left" ? 20 : current.position === "right" ? -20 : 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="globe-tutorial-card fixed z-[10000] w-[340px] max-w-[90vw]"
          style={tooltipStyle}
        >
          <div className="bg-paw-panel rounded-paw-lg shadow-paw-panel border border-paw-border overflow-hidden">
            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-paw-primary to-paw-trust" />

            <div className="p-5">
              {/* Progress + close */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === step ? "w-5 bg-paw-primary" : i < step ? "w-2.5 bg-paw-primary/45" : "w-2.5 bg-paw-border"
                      }`}
                    />
                  ))}
                </div>
                <button onClick={dismiss} aria-label="Close globe tutorial" className="text-paw-muted hover:text-paw-body transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl leading-none mt-0.5">{current.emoji}</span>
                <div>
                  <h3 className="text-base font-extrabold text-paw-ink mb-1">{current.title}</h3>
                  <p className="text-sm text-paw-muted leading-relaxed">{current.description}</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between">
                <button onClick={dismiss} className="text-xs text-paw-muted hover:text-paw-body font-medium">
                  Skip
                </button>
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button onClick={prev} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-paw-muted bg-paw-panel-subtle hover:bg-paw-primary-soft rounded-paw-sm transition-all">
                      <ChevronLeft className="w-3 h-3" /> Back
                    </button>
                  )}
                  <button onClick={next} className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-paw-primary hover:bg-paw-primary-hover rounded-paw-sm transition-all shadow-paw-action">
                    {isLast ? (
                      <><Sparkles className="w-3 h-3" /> Got it!</>
                    ) : (
                      <>Next <ChevronRight className="w-3 h-3" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

/* ── Position tooltip relative to target element ── */
function getTooltipPosition(
  position: "top" | "bottom" | "left" | "right",
  rect: DOMRect
): React.CSSProperties {
  const gap = 20;
  const safeLeft = Math.max(16, Math.min(window.innerWidth - 356, rect.left + rect.width / 2 - 170));

  if (rect.width > window.innerWidth * 0.82 || rect.height > window.innerHeight * 0.72) {
    return {
      top: window.innerWidth < 640 ? 92 : 82,
      left: safeLeft,
    };
  }

  switch (position) {
    case "top":
      return {
        bottom: window.innerHeight - rect.top + gap,
        left: safeLeft,
      };
    case "bottom":
      return {
        top: rect.bottom + gap,
        left: safeLeft,
      };
    case "left":
      return {
        top: Math.max(16, rect.top + rect.height / 2 - 80),
        right: window.innerWidth - rect.left + gap,
      };
    case "right":
      return {
        top: Math.max(16, rect.top + rect.height / 2 - 80),
        left: rect.right + gap,
      };
  }
}
