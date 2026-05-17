import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import ConditionalFooter from "@/components/ConditionalFooter";

export const metadata: Metadata = {
  title: "PawPal - The Smart Map for Pets",
  description: "Connect with pet lovers worldwide. Adopt, walk, and share moments on the PawPal Globe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paw-canvas text-paw-ink antialiased selection:bg-paw-primary/20">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
