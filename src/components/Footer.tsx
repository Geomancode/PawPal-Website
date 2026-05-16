"use client";

import Link from "next/link";
import { Heart, Github, Twitter, Instagram, Mail } from "lucide-react";
import PawPalLogo from "./PawPalLogo";
import { DoodlePaw, DoodleDog } from "./PetDoodles";

const FOOTER_NAV = {
  Product: [
    { label: "Globe", href: "/globe" },
    { label: "Store", href: "/store" },
    { label: "Download App", href: "#" },
  ],
  Community: [
    { label: "About Us", href: "/about" },
    { label: "NFC Tags", href: "/store" },
    { label: "Local Network", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

const SOCIALS = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Mail, href: "mailto:hello@pawpal.be", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#1A1D23] text-gray-400 overflow-hidden">
      {/* Decorative doodles */}
      <div className="absolute top-8 right-12 w-20 h-20 text-white/[0.03] hidden lg:block"><DoodleDog className="w-full h-full" /></div>
      <div className="absolute bottom-16 left-10 w-14 h-14 text-white/[0.03] hidden lg:block"><DoodlePaw className="w-full h-full" /></div>
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand column — using real logo (dark variant) */}
          <div className="col-span-2">
            <div className="mb-4">
              <PawPalLogo iconSize={28} fontSize={20} variant="dark" />
            </div>
            <p className="text-sm leading-relaxed max-w-xs mb-6">
              Enhancing the bond between you and your pet — with gamified walks, NFC safety tags, and a trusted local community.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-gray-700 hover:bg-[#F5A623] flex items-center justify-center transition-colors group"
                >
                  <s.icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_NAV).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-[#F5A623] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs">
            © {new Date().getFullYear()} PawPal. All rights reserved.
          </p>
          <p className="text-xs flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for every paw
          </p>
        </div>
      </div>
    </footer>
  );
}
