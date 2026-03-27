"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Globe2, Menu, X, LogOut, UserCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";

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
    <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b-0 border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Globe2 className="w-8 h-8 text-amber-500" />
            <span className="text-xl font-bold tracking-tight text-gray-900">PawPal<span className="text-amber-500">.</span></span>
          </Link>
          
          {/* Desktop nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md transition-colors font-medium ${
                      isActive
                        ? "text-amber-600 font-semibold"
                        : "text-gray-600 hover:text-amber-500"
                    }`}
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
              <div className="w-20 h-9 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              /* Logged-in: avatar dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-amber-700 max-w-[100px] truncate">{displayName}</span>
                </button>

                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
                    >
                      <UserCircle className="w-4 h-4" />
                      My Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Not logged in: Sign In button */
              <Link href="/auth" className={`px-6 py-2 rounded-full font-bold transition-all border inline-block ${
                pathname === "/auth"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              }`}>
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-amber-500">
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
          className="md:hidden bg-white/80 backdrop-blur-xl"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive ? "text-amber-600 font-semibold" : "text-gray-600 hover:text-amber-500"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 border-t border-gray-100 mt-2 pt-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold truncate">{displayName}</span>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 rounded-md"
                >
                  <UserCircle className="w-4 h-4" />
                  My Profile
                </Link>
                <button
                  onClick={() => { setIsOpen(false); handleSignOut(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-amber-500" onClick={() => setIsOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
