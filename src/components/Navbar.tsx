"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, LogOut, UserCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { buttonClassName } from "@/components/ui/Button";
import { cn } from "@/lib/ui";
import PawPalLogo from "./PawPalLogo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/globe", label: "Globe" },
  { href: "/about", label: "About Us" },
  { href: "/store", label: "Store" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

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
    <nav className="fixed top-0 w-full z-50 border-b border-paw-border/80 bg-paw-panel/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <PawPalLogo />
          
          {/* Desktop nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center gap-2">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-paw-sm px-3 py-2 text-sm font-bold transition-colors",
                      isActive
                        ? "bg-paw-primary-soft text-paw-primary"
                        : "text-paw-muted hover:bg-slate-100 hover:text-paw-ink",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side: Auth button or User menu */}
          <div className="hidden md:block">
            {loading ? (
              <div className="w-24 h-10 bg-slate-100 rounded-paw-md animate-pulse" />
            ) : user ? (
              /* Logged-in: avatar dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 rounded-paw-md border border-paw-border bg-paw-panel px-3 py-2 transition-all hover:border-paw-primary/40 hover:bg-paw-primary-soft"
                >
                  <div className="w-7 h-7 rounded-paw-sm bg-paw-primary flex items-center justify-center text-white text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-paw-ink max-w-[110px] truncate">{displayName}</span>
                </button>

                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 mt-2 w-56 bg-paw-panel rounded-paw-lg shadow-paw-floating border border-paw-border overflow-hidden py-1"
                  >
                    <div className="px-4 py-3 border-b border-paw-border">
                      <p className="text-sm font-bold text-paw-ink truncate">{displayName}</p>
                      <p className="text-xs text-paw-muted truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-paw-body hover:bg-paw-primary-soft transition-colors"
                    >
                      <UserCircle className="w-4 h-4" />
                      My Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-paw-danger hover:bg-paw-danger-soft transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Not logged in: Sign In button */
              <Link
                href="/auth"
                className={buttonClassName({
                  variant: pathname === "/auth" ? "primary" : "secondary",
                  size: "md",
                })}
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-paw-sm p-2 text-paw-muted hover:bg-slate-100 hover:text-paw-primary"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-paw-border bg-paw-panel/95 backdrop-blur-xl"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block rounded-paw-sm px-3 py-2 text-base font-bold",
                    isActive
                      ? "bg-paw-primary-soft text-paw-primary"
                      : "text-paw-muted hover:bg-slate-100 hover:text-paw-ink",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-paw-ink border-t border-paw-border mt-2 pt-3">
                  <div className="w-7 h-7 rounded-paw-sm bg-paw-primary flex items-center justify-center text-white text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold truncate">{displayName}</span>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-paw-body hover:bg-paw-primary-soft rounded-paw-sm"
                >
                  <UserCircle className="w-4 h-4" />
                  My Profile
                </Link>
                <button
                  onClick={() => { setIsOpen(false); handleSignOut(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-paw-danger hover:bg-paw-danger-soft rounded-paw-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth" className="block px-3 py-2 rounded-paw-sm text-base font-bold text-paw-muted hover:bg-paw-primary-soft hover:text-paw-primary" onClick={() => setIsOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
