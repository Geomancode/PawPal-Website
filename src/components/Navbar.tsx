"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, UserCircle, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuth } from "./AuthProvider";
import PawPalLogo from "./PawPalLogo";
import styles from "./Navbar.module.css";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotionSnapshot() {
  return false;
}

function useReducedMotionPreference() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/globe", label: "Globe" },
  { href: "/about", label: "About Us" },
  { href: "/store", label: "Store" },
];

const PROFILE_LINK = { href: "/profile", label: "Profile" };

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const shouldReduceMotion = useReducedMotionPreference();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const isGlobeRoute = pathname === "/globe";
  const navLinks = user ? [...NAV_LINKS, PROFILE_LINK] : NAV_LINKS;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
    router.push("/");
  };

  return (
    <motion.nav
      className={`${styles.siteNav} fixed ${
        isGlobeRoute
          ? `${styles.siteNavMap} inset-x-3 top-3 z-[9900] sm:inset-x-4`
          : "inset-x-0 top-0 z-[10000]"
      }`}
      initial={false}
      animate={{ y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${
          isGlobeRoute ? "h-12 sm:h-14" : scrolled ? "h-16" : "h-20"
        }`}>
          <Link href="/" className="flex items-center transition-opacity hover:opacity-80" aria-label="PawPal home">
            <PawPalLogo
              iconSize={isGlobeRoute ? 26 : scrolled ? 28 : 32}
              fontSize={isGlobeRoute ? 18 : scrolled ? 20 : 22}
              variant="adaptive"
            />
          </Link>

          <div className={`hidden md:flex md:items-center ${isGlobeRoute ? "md:gap-3" : "md:gap-8"}`}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLinkPill} relative text-sm font-bold transition-colors ${
                    isActive ? `${styles.isActive} text-paw-primary` : "text-paw-body hover:text-paw-primary"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-paw-primary"
                      transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:block">
            {loading ? (
              <div
                className="h-11 w-24 animate-pulse rounded-paw-sm border border-paw-border bg-paw-panel-subtle"
                aria-label="Loading account status"
                role="status"
              />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  aria-label="Open account menu"
                  aria-expanded={showDropdown}
                  onClick={() => setShowDropdown((value) => !value)}
                  className="inline-flex h-11 items-center gap-2 rounded-paw-sm border border-paw-border-strong bg-white px-3 text-sm font-bold text-paw-ink transition hover:border-paw-primary hover:text-paw-primary"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paw-primary text-xs font-black text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-28 truncate">{displayName}</span>
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
                      className="absolute right-0 mt-3 w-56 overflow-hidden rounded-paw-md border border-paw-border bg-white py-1 shadow-paw-panel"
                    >
                      <div className="border-b border-paw-border px-4 py-3">
                        <p className="truncate text-sm font-extrabold text-paw-ink">{displayName}</p>
                        <p className="truncate text-xs text-paw-muted">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-paw-ink transition-colors hover:bg-paw-primary-soft"
                      >
                        <UserCircle className="h-4 w-4" />
                        My Profile
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-paw-danger transition-colors hover:bg-paw-danger-soft"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/auth"
                className={`inline-flex h-11 items-center justify-center rounded-paw-sm border px-5 text-sm font-bold transition ${
                  pathname === "/auth"
                    ? "border-paw-primary-contrast bg-paw-primary-contrast text-white"
                    : "border-paw-border-strong bg-white text-paw-ink hover:border-paw-primary hover:text-paw-primary"
                }`}
              >
                Login
              </Link>
            )}
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-paw-sm border border-paw-border bg-white text-paw-ink md:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
            className={`${styles.navMobilePanel} overflow-hidden border-t border-paw-border bg-white md:hidden`}
          >
            <div className="space-y-1 px-5 py-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block rounded-paw-sm px-3 py-3 text-base font-bold ${
                      isActive ? "bg-paw-primary-soft text-paw-primary" : "text-paw-ink hover:bg-paw-panel-subtle"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="border-t border-paw-border pt-3">
                {loading ? (
                  <div
                    className="mx-3 h-10 animate-pulse rounded-paw-sm bg-paw-panel-subtle"
                    aria-label="Loading account status"
                    role="status"
                  />
                ) : user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 text-sm text-paw-ink">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paw-primary text-xs font-black text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate font-extrabold">{displayName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        handleSignOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-paw-sm px-3 py-3 text-sm font-bold text-paw-danger hover:bg-paw-danger-soft"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth"
                    className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-paw-sm bg-paw-primary-contrast px-5 text-sm font-bold text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
