"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail } from "lucide-react";
import PawPalLogo from "./PawPalLogo";

const FOOTER_NAV = {
  Product: [
    { label: "Globe Map", href: "/globe" },
    { label: "NFC Safety Tag", href: "/store" },
    { label: "AI Assistant", href: "/globe" },
    { label: "Community", href: "/globe" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Store", href: "/store" },
    { label: "Help Center", href: "/help" },
  ],
  Support: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Contact", href: "mailto:hello@pawpal.be" },
  ],
};

const SOCIALS = [
  { icon: Instagram, href: "https://www.instagram.com/", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/", label: "Facebook" },
  { icon: Mail, href: "mailto:hello@pawpal.be", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="border-t border-paw-border bg-white text-paw-body">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <PawPalLogo iconSize={30} fontSize={22} variant="light" />
          <p className="mt-5 max-w-xs text-sm leading-7 text-paw-body">
            Smart walks. Safe pets. Stronger local communities for pet parents across Belgium and the EU.
          </p>
          <div className="mt-6 flex gap-2">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-paw-sm border border-paw-border bg-white text-paw-muted transition hover:border-paw-primary hover:text-paw-primary"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {Object.entries(FOOTER_NAV).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.12em] text-paw-ink">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm font-medium text-paw-body transition hover:text-paw-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.12em] text-paw-ink">Stay in the loop</h3>
            <p className="text-sm leading-6 text-paw-body">Get updates and local pet highlights.</p>
            <form className="mt-4 flex overflow-hidden rounded-paw-sm border border-paw-border bg-white">
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                placeholder="Email address"
                className="min-w-0 flex-1 px-3 py-2 text-sm text-paw-ink outline-none placeholder:text-paw-muted"
              />
              <button type="submit" className="bg-paw-primary px-4 text-xs font-bold text-white transition hover:bg-paw-primary-hover">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-paw-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs font-medium text-paw-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} PawPal. All rights reserved.</p>
          <p>Made in Belgium · English (EN)</p>
        </div>
      </div>
    </footer>
  );
}
