import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import Navbar, { LocalizedSkipLink } from "@/components/Navbar";
import Providers from "@/components/Providers";
import ConditionalFooter from "@/components/ConditionalFooter";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { I18nProvider } from "@/i18n/I18nProvider";
import { resolveMessages } from "@/i18n/messages";
import { defaultLocale } from "@/i18n/locales";
import { siteConfig } from "@/lib/site";
import {
  PAWPAL_METADATA_BASE,
  PAWPAL_OG_IMAGE,
  PAWPAL_OG_IMAGE_PATH,
} from "./metadata";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(PAWPAL_METADATA_BASE),
  title: {
    default: siteConfig.title,
    template: "%s | PawPal",
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  creator: "PawPal",
  publisher: "PawPal",
  category: "Pet technology",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: PAWPAL_METADATA_BASE,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    locale: siteConfig.locale,
    images: [PAWPAL_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [PAWPAL_OG_IMAGE_PATH],
  },
  appleWebApp: {
    capable: true,
    title: "PawPal",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: "/assets/logos/pawpal-logo-light.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/assets/logos/pawpal-logo-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/assets/logos/pawpal-logo-light.svg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${PAWPAL_METADATA_BASE}/#organization`,
      name: siteConfig.name,
      url: PAWPAL_METADATA_BASE,
      email: siteConfig.email,
      logo: `${PAWPAL_METADATA_BASE}/assets/logos/pawpal-logo-light.svg`,
      foundingLocation: {
        "@type": "Place",
        name: "Ghent, Belgium",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${PAWPAL_METADATA_BASE}/#website`,
      url: PAWPAL_METADATA_BASE,
      name: siteConfig.name,
      description: siteConfig.description,
      publisher: {
        "@id": `${PAWPAL_METADATA_BASE}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${PAWPAL_METADATA_BASE}/store?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = defaultLocale;
  const messages = resolveMessages(locale);

  return (
    <html lang={locale} data-scroll-behavior="smooth" className={nunitoSans.variable}>
      <body className="min-h-screen bg-paw-page text-paw-ink antialiased selection:bg-paw-primary/20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <I18nProvider locale={locale} messages={messages}>
          <Providers>
            <LocalizedSkipLink />
            <Navbar />
            <main id="main-content" className="relative z-20" tabIndex={-1}>{children}</main>
            <ConditionalFooter />
            <CookieConsentBanner />
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
