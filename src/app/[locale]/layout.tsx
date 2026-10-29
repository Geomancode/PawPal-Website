import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "@/app/globals.css";
import Navbar, { LocalizedSkipLink } from "@/components/Navbar";
import Providers from "@/components/Providers";
import ConditionalFooter from "@/components/ConditionalFooter";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getServerMessages } from "@/i18n/serverMessages";
import { locales } from "@/i18n/locales";
import { localizedPath } from "@/i18n/routing";
import { siteConfig } from "@/lib/site";
import {
  PAWPAL_METADATA_BASE,
  PAWPAL_OG_IMAGE,
  PAWPAL_OG_IMAGE_PATH,
  openGraphLocale,
} from "@/app/metadata";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale, messages } = await getServerMessages((await params).locale);
  return {
  metadataBase: new URL(PAWPAL_METADATA_BASE),
  title: {
    default: messages.siteTitle,
    template: "%s | PawPal",
  },
  description: messages.siteDescription,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  creator: "PawPal",
  publisher: "PawPal",
  category: "Pet technology",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: localizedPath("/", locale),
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
    url: new URL(localizedPath("/", locale), PAWPAL_METADATA_BASE).toString(),
    siteName: siteConfig.name,
    title: messages.siteTitle,
    description: messages.siteDescription,
    locale: openGraphLocale(locale),
    images: [{ ...PAWPAL_OG_IMAGE, alt: messages.siteOgImageAlt }],
  },
  twitter: {
    card: "summary_large_image",
    title: messages.siteTitle,
    description: messages.siteDescription,
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
}

function siteJsonLd(description: string) {
  return {
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
      description,
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
}

export default async function RootLayout({ children, params }: LocaleLayoutProps) {
  const { locale, messages } = await getServerMessages((await params).locale);
  const jsonLd = siteJsonLd(messages.siteDescription);

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
            <main id="main-content" className="relative" style={{ zIndex: 20 }} tabIndex={-1}>{children}</main>
            <ConditionalFooter />
            <CookieConsentBanner />
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
