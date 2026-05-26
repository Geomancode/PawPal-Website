"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, UserCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import PawPalLogo from "./PawPalLogo";

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
  const navLinks = user ? [...NAV_LINKS, PROFILE_LINK] : NAV_LINKS;

  // Phase 1 Effect #5: Scroll-aware navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <motion.nav
      style={{ zIndex: 10000 }}
      className="fixed top-0 w-full border-b border-white/20 bg-[#4A90D9] shadow-[0_1px_3px_rgba(58,47,42,0.08)] transition-all duration-500"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-500 ${scrolled ? "h-16" : "h-20"}`}>
          {/* Logo — real Tracker icon + wordmark */}
          <Link href="/" className="flex items-center transition-opacity hover:opacity-80 [&_.font-brand_span]:!text-white">
            <PawPalLogo
              iconSize={scrolled ? 28 : 32}
              fontSize={scrolled ? 20 : 22}
              variant="dark"
            />
          </Link>
          
          {/* Desktop nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-2 rounded-md transition-colors font-medium ${
                      isActive
                        ? "bg-white/15 text-white font-semibold"
                        : "text-white hover:bg-white/15"
                    }`}
                  >
                    {link.label}
                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side: Auth button or User menu */}
          <div className="hidden md:block">
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-paw-md bg-white/25" />
            ) : user ? (
              /* Logged-in: avatar dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  aria-label="Open account menu"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 rounded-paw-lg border border-white bg-white/10 px-4 py-2 transition-all hover:bg-white/15"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-paw-sm bg-paw-primary text-xs font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate text-sm font-semibold text-white">{displayName}</span>
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      style={{ zIndex: 10001 }}
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-paw-lg border border-paw-border bg-paw-panel py-1 shadow-paw-panel"
                    >
                      <div className="border-b border-paw-border px-4 py-3">
                        <p className="truncate text-sm font-semibold text-paw-ink">{displayName}</p>
                        <p className="truncate text-xs text-paw-muted">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-paw-ink transition-colors hover:bg-paw-primary-soft"
                      >
                        <UserCircle className="w-4 h-4" />
                        My Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-paw-danger transition-colors hover:bg-paw-danger-soft"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Not logged in: Sign In button — Coral-led CTA */
              <Link href="/auth" className={`px-6 py-2 rounded-full font-bold transition-all border inline-block ${
                pathname === "/auth"
                  ? "border-white bg-white/20 text-white"
                  : "border-white/70 bg-white/10 text-white hover:border-white hover:bg-white/20"
              }`}>
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-white/80">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/15 bg-[#4A90D9] md:hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive ? "bg-white/15 text-white font-semibold" : "text-white hover:bg-white/15"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {user ? (
                <>
                  <div className="mt-2 flex items-center gap-2 border-t border-white/20 px-3 py-2 pt-3 text-sm text-white">
                    <div className="flex h-7 w-7 items-center justify-center rounded-paw-sm bg-paw-primary text-xs font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold truncate">{displayName}</span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-white/15"
                  >
                    <UserCircle className="w-4 h-4" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => { setIsOpen(false); handleSignOut(); }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-white/15"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/auth" className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-white/15" onClick={() => setIsOpen(false)}>
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
