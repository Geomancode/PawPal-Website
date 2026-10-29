import type { Metadata } from "next";
import { getServerMessages } from "@/i18n/serverMessages";
import { publicPageMetadata } from "@/app/metadata";

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale, messages } = await getServerMessages((await params).locale);
  return publicPageMetadata({
    title: messages.footerTermsOfService,
    description: messages.termsHeroCopy,
    path: "/terms",
    locale,
    imageAlt: messages.siteOgImageAlt,
  });
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
