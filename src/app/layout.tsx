import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import ConditionalFooter from "@/components/ConditionalFooter";

export const metadata: Metadata = {
  title: "PawPal - The Smart Map for Pets",
  description: "Connect with pet lovers worldwide. Adopt, walk, and share moments on the PawPal Globe.",
  manifest: "/manifest.webmanifest",
  applicationName: "PawPal",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paw-page text-paw-ink antialiased selection:bg-paw-primary/20">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
