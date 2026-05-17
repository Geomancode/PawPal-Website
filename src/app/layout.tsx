import type { Metadata } from "next";
import { Inter, Baloo_2 } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import ConditionalFooter from "@/components/ConditionalFooter";

const inter = Inter({ subsets: ["latin"] });
const baloo2 = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo2",
});

export const metadata: Metadata = {
  title: "PawPal - The Smart Map for Pets",
  description: "Connect with pet lovers worldwide. Adopt, walk, and share moments on the PawPal Globe.",
  icons: {
    icon: "/pawpal_favicon.svg",
    apple: "/pawpal_icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${baloo2.variable} antialiased min-h-screen bg-[#F7F8FA] text-[#2D3748] selection:bg-amber-400/30`}>
        <Providers>
          <Navbar />
          <main className="relative z-[1]">{children}</main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
