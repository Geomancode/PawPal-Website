import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} antialiased min-h-screen bg-[#fffdf9] text-gray-800 selection:bg-amber-400/30`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
