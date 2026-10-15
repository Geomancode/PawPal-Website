"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import PawIcon from "./icons/PawIcon";
import { useAuth } from "./AuthProvider";
import PawPalLogo from "./PawPalLogo";
import styles from "./Navbar.module.css";
import { useI18n } from "@/i18n/I18nProvider";
import { localeFromPath, localizedPath, stripLocalePrefix } from "@/i18n/routing";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

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

export default function Navbar() {
  const { path } = useI18n();
  const { loader, t } = useRouteTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const shouldReduceMotion = useReducedMotionPreference();
  const normalizedPathname = stripLocalePrefix(pathname || "/");
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || t("navUserFallback");
  const isGlobeRoute = normalizedPathname === "/globe";
  const navLinks = [
    { href: "/", label: t("navHome") },
    { href: "/globe", label: t("navGlobe") },
    { href: "/companion", label: t("companionTitle") },
    { href: "/about", label: t("navAboutUs") },
    { href: "/store", label: t("navStore") },
    ...(user ? [{ href: "/profile", label: t("navProfile") }] : []),
  ];

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

  useEffect(() => {
    if (!isOpen) return;

    function handleMobileMenuKeyDown(event: KeyboardEvent) {
      const menu = mobileMenuRef.current;
      const toggle = mobileMenuButtonRef.current;
      if (!menu || !toggle || menu.getClientRects().length === 0) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        requestAnimationFrame(() => toggle.focus());
        return;
      }

      if (event.key !== "Tab") return;

      const menuItems = Array.from(
        menu.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      const focusableElements = [toggle, ...menuItems];
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (!focusableElements.includes(activeElement as HTMLElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      }
    }

    document.addEventListener("keydown", handleMobileMenuKeyDown);
    return () => document.removeEventListener("keydown", handleMobileMenuKeyDown);
  }, [isOpen]);

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
    router.push(path("/"));
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
      {loader}
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${
          isGlobeRoute ? "h-12 sm:h-14" : scrolled ? "h-16" : "h-20"
        }`}>
          <Link href={path("/")} className={`${styles.homeLink} transition-opacity hover:opacity-80`} aria-label={t("navbarHomeAriaLabel")}>
            <PawPalLogo
              iconSize={isGlobeRoute ? 26 : scrolled ? 28 : 32}
              fontSize={isGlobeRoute ? 18 : scrolled ? 20 : 22}
              variant="adaptive"
              priority
            />
          </Link>

          <div className={`hidden xl:flex xl:items-center ${isGlobeRoute ? "xl:gap-3" : "xl:gap-5"}`}>
            {navLinks.map((link) => {
              const isActive = normalizedPathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href === "/companion" ? localizedPath(link.href, localeFromPath(pathname)) : path(link.href)}
                  className={`${styles.navLinkPill} relative text-paw-type-body font-bold transition-colors ${
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

          <div className="hidden xl:block">
            {loading ? (
              <div
                className="h-11 w-24 animate-pulse rounded-paw-sm border border-paw-border bg-paw-panel-subtle"
                aria-label={t("navLoadingAccountStatus")}
                role="status"
              />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  aria-label={t("navOpenAccountMenu")}
                  aria-expanded={showDropdown}
                  onClick={() => setShowDropdown((value) => !value)}
                  className="inline-flex h-11 items-center gap-2 rounded-paw-sm border border-paw-border-strong bg-paw-panel px-3 text-paw-type-body font-bold text-paw-ink transition hover:border-paw-primary hover:text-paw-primary"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paw-primary text-paw-type-caption font-black text-paw-on-primary">
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
                      className="absolute right-0 mt-3 w-56 overflow-hidden rounded-paw-md border border-paw-border bg-paw-panel py-1 shadow-paw-panel"
                    >
                      <div className="border-b border-paw-border px-4 py-3">
                        <p className="truncate text-paw-type-body font-extrabold text-paw-ink">{displayName}</p>
                        <p className="truncate text-paw-type-caption text-paw-muted">{user.email}</p>
                      </div>
                      <Link
                        href={path("/profile")}
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center gap-2 px-4 py-3 text-paw-type-body font-semibold text-paw-ink transition-colors hover:bg-paw-primary-soft"
                      >
                        <PawIcon name="account" className="h-4 w-4" />
                        {t("navMyProfile")}
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-4 py-3 text-paw-type-body font-semibold text-paw-danger transition-colors hover:bg-paw-danger-soft"
                      >
                        <PawIcon name="logout" className="h-4 w-4" />
                        {t("navSignOut")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href={path("/auth")}
                className={`inline-flex h-11 items-center justify-center rounded-paw-sm border px-5 text-paw-type-body font-bold transition ${
                  normalizedPathname === "/auth"
                    ? "border-paw-primary bg-paw-primary text-paw-accent-ink"
                    : "border-paw-border-strong bg-paw-panel text-paw-ink hover:border-paw-primary hover:text-paw-primary"
                }`}
              >
                {t("navLogin")}
              </Link>
            )}
          </div>

          <button
            ref={mobileMenuButtonRef}
            type="button"
            aria-label={isOpen ? t("navCloseNavigationMenu") : t("navOpenNavigationMenu")}
            aria-controls="pawpal-mobile-navigation"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
            className="inline-flex h-paw-min-tap w-paw-min-tap items-center justify-center rounded-paw-sm border border-paw-border bg-paw-panel text-paw-ink xl:hidden"
          >
            {isOpen ? <PawIcon name="close" className="h-5 w-5" /> : <PawIcon name="menu" className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={mobileMenuRef}
            id="pawpal-mobile-navigation"
            initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
            className={`${styles.navMobilePanel} overflow-hidden border-t border-paw-border bg-paw-panel xl:hidden`}
          >
            <div className="space-y-1 px-5 py-4">
              {navLinks.map((link) => {
                const isActive = normalizedPathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href === "/companion" ? localizedPath(link.href, localeFromPath(pathname)) : path(link.href)}
                    className={`block rounded-paw-sm px-3 py-3 text-paw-type-body font-bold ${
                      isActive ? "bg-paw-primary-soft text-paw-on-primary-soft" : "text-paw-ink hover:bg-paw-panel-subtle"
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
                    aria-label={t("navLoadingAccountStatus")}
                    role="status"
                  />
                ) : user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 text-paw-type-body text-paw-ink">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paw-primary text-paw-type-caption font-black text-paw-on-primary">
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
                      className="flex w-full items-center gap-2 rounded-paw-sm px-3 py-3 text-paw-type-body font-bold text-paw-danger hover:bg-paw-danger-soft"
                    >
                      <PawIcon name="logout" className="h-4 w-4" />
                      {t("navSignOut")}
                    </button>
                  </>
                ) : (
                  <Link
                    href={path("/auth")}
                    className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-paw-sm bg-paw-primary px-5 text-paw-type-body font-bold text-paw-accent-ink"
                    onClick={() => setIsOpen(false)}
                  >
                    {t("navLogin")}
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

export function LocalizedSkipLink() {
  const { loader, t } = useRouteTranslations();

  return (
    <>
      {loader}
      <a href="#main-content" className="skip-to-content">
        {t("skipToContent")}
      </a>
    </>
  );
}
