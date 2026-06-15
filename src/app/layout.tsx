import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import ConditionalFooter from "@/components/ConditionalFooter";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
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
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    locale: siteConfig.locale,
    images: [
      {
        url: "/images/app-mockup.png",
        width: 1024,
        height: 1024,
        alt: "PawPal app and smart pet safety experience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/images/app-mockup.png"],
  },
  appleWebApp: {
    capable: true,
    title: "PawPal",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/pawpal_favicon.svg",
    apple: "/pawpal_icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#4A90D9",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      email: siteConfig.email,
      logo: `${siteConfig.url}/pawpal_icon.svg`,
      foundingLocation: {
        "@type": "Place",
        name: "Ghent, Belgium",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
      publisher: {
        "@id": `${siteConfig.url}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteConfig.url}/store?search={search_term_string}`,
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
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-paw-page text-paw-ink antialiased selection:bg-paw-primary/20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <a href="#main-content" className="skip-to-content">
            Skip to PawPal content
          </a>
          <Navbar />
          <main id="main-content" className="relative" style={{ zIndex: 20 }} tabIndex={-1}>{children}</main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
