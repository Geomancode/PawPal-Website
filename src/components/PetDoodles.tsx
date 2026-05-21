"use client";

/**
 * PetDoodles — Pawlace-inspired monolinear pet illustrations
 * 
 * Thick black outlines (~2.5px), rounded caps, minimal features.
 * Use as decorative floating elements across all pages.
 */

export function DoodleDog({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M35 85c0-15 10-25 25-25s25 10 25 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="50" cy="48" r="3" fill="currentColor"/>
      <circle cx="70" cy="48" r="3" fill="currentColor"/>
      <path d="M55 55c2 3 8 3 10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M60 35c-15-5-25 5-28 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M60 35c15-5 25 5 28 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M30 45c-5-12 0-25 5-28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M90 45c5-12 0-25-5-28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M85 85v-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M80 95c5 0 8-3 8-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function DoodleCat({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 80c0-12 8-22 20-22s20 10 20 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="52" cy="52" r="2.5" fill="currentColor"/>
      <circle cx="68" cy="52" r="2.5" fill="currentColor"/>
      <path d="M57 57c1.5 2 5.5 2 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M42 42l-8-20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M78 42l8-20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M34 22c3 5 8 15 8 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M86 22c-3 5-8 15-8 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M80 80c8 2 15-2 20-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M100 72c3-2 5-1 6 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="45" y1="55" x2="30" y2="52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="45" y1="58" x2="30" y2="60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="75" y1="55" x2="90" y2="52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="75" y1="58" x2="90" y2="60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function DoodlePaw({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="52" rx="14" ry="12" stroke="currentColor" strokeWidth="2.5"/>
      <ellipse cx="25" cy="35" rx="6" ry="8" stroke="currentColor" strokeWidth="2.5" transform="rotate(-15 25 35)"/>
      <ellipse cx="55" cy="35" rx="6" ry="8" stroke="currentColor" strokeWidth="2.5" transform="rotate(15 55 35)"/>
      <ellipse cx="35" cy="28" rx="5" ry="7" stroke="currentColor" strokeWidth="2.5" transform="rotate(-5 35 28)"/>
      <ellipse cx="47" cy="28" rx="5" ry="7" stroke="currentColor" strokeWidth="2.5" transform="rotate(5 47 28)"/>
    </svg>
  );
}

export function DoodleBone({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 15c-5-8-18-5-18 5s13 13 18 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M75 15c5-8 18-5 18 5s-13 13-18 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M25 20h50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M25 30c-5 8-18 5-18-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M75 30c5 8 18 5 18-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M25 30h50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export function DoodleHeart({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 70S10 50 10 30c0-11 9-20 20-20 6 0 10 4 10 4s4-4 10-4c11 0 20 9 20 20 0 20-30 40-30 40z"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function DoodleBowl({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 25h70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 25c0 18 12 25 30 25s30-7 30-25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="50" cy="18" rx="8" ry="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M45 13c-1-4 0-8 3-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M55 13c1-4 0-8-3-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/** Pre-composed decorative layouts for sections */
export function SectionDoodles({ variant = "default" }: { variant?: "default" | "alt" | "minimal" }) {
  if (variant === "minimal") {
    return (
      <>
        <div className="absolute top-8 right-6 w-14 h-14 text-paw-primary/10 doodle-float hidden lg:block">
          <DoodlePaw className="w-full h-full" />
        </div>
      </>
    );
  }

  if (variant === "alt") {
    return (
      <>
        <div className="absolute top-12 left-6 w-16 h-16 text-paw-primary/10 doodle-float-alt hidden lg:block" style={{ animationDelay: "1s" }}>
          <DoodleCat className="w-full h-full" />
        </div>
        <div className="absolute bottom-8 right-8 w-12 h-12 text-paw-trust/10 doodle-float hidden lg:block" style={{ animationDelay: "3s" }}>
          <DoodleHeart className="w-full h-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="absolute top-10 right-6 w-20 h-20 text-paw-primary/10 doodle-float hidden lg:block">
        <DoodleDog className="w-full h-full" />
      </div>
      <div className="absolute bottom-10 left-6 w-16 h-16 text-paw-primary/10 doodle-float-alt hidden lg:block" style={{ animationDelay: "2s" }}>
        <DoodleBone className="w-full h-full" />
      </div>
    </>
  );
}
