"use client";

import Link from "next/link";
import { Globe2, Heart, Github, Twitter, Instagram, Mail } from "lucide-react";

const FOOTER_NAV = {
  Product: [
    { label: "Globe", href: "/globe" },
    { label: "Store", href: "/store" },
    { label: "Download App", href: "#" },
  ],
  Community: [
    { label: "About Us", href: "/about" },
    { label: "Missions", href: "/globe" },
    { label: "Guilds", href: "#" },
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
    <footer className="bg-gray-900 text-gray-400">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="w-7 h-7 text-amber-500" />
              <span className="text-xl font-bold text-white tracking-tight">PawPal<span className="text-amber-500">.</span></span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs mb-6">
              The smart map for pet lovers. Discover missions, adopt animals, and connect with a global community that cares.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-amber-500 flex items-center justify-center transition-colors group"
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
                      className="text-sm hover:text-amber-400 transition-colors"
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
      <div className="border-t border-gray-800">
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
