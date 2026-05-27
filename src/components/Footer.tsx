"use client";

import Link from "next/link";
import { Heart, Github, Twitter, Instagram, Mail } from "lucide-react";
import PawPalLogo from "./PawPalLogo";
import { DoodlePaw, DoodleDog } from "./PetDoodles";

const FOOTER_NAV = {
  Product: [
    { label: "Globe", href: "/globe" },
    { label: "Store", href: "/store" },
    { label: "Open Globe", href: "/globe" },
  ],
  Community: [
    { label: "About Us", href: "/about" },
    { label: "NFC Tags", href: "/store" },
    { label: "Local Network", href: "/globe" },
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
    <footer className="relative overflow-hidden bg-paw-ink text-slate-300">
      <div className="h-1 bg-gradient-to-r from-paw-primary via-paw-warning to-paw-trust" />
      {/* Decorative doodles */}
      <div className="absolute top-8 right-12 hidden h-20 w-20 text-paw-primary/[0.05] lg:block"><DoodleDog className="h-full w-full" /></div>
      <div className="absolute bottom-16 left-10 hidden h-14 w-14 text-paw-trust/[0.05] lg:block"><DoodlePaw className="h-full w-full" /></div>
      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand column — using real logo (dark variant) */}
          <div className="col-span-2">
            <div className="mb-4">
              <PawPalLogo iconSize={28} fontSize={20} variant="dark" />
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-slate-300/82">
              Enhancing the bond between you and your pet — with gamified walks, NFC safety tags, and a trusted local community.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] transition-colors hover:border-paw-primary/40 hover:bg-paw-primary"
                >
                  <s.icon className="h-4 w-4 text-slate-300 transition-colors group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_NAV).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300/82 transition-colors hover:text-paw-primary"
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
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} PawPal. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            Made with <Heart className="h-3 w-3 fill-paw-primary text-paw-primary" /> for every paw
          </p>
        </div>
      </div>
    </footer>
  );
}
