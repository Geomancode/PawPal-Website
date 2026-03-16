"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Globe2, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/globe", label: "Globe" },
  { href: "/about", label: "About Us" },
  { href: "/store", label: "Store" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b-0 border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo — links to home */}
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

          <div className="hidden md:block">
            <Link href="/auth" className={`px-6 py-2 rounded-full font-bold transition-all border inline-block ${
              pathname === "/auth"
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            }`}>
              Sign In
            </Link>
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
          className="md:hidden glass"
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
            <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-amber-500" onClick={() => setIsOpen(false)}>
              Sign In
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
