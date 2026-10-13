import type { Metadata } from "next";
import { getServerMessages } from "@/i18n/serverMessages";
import { privatePageMetadata } from "@/app/metadata";

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale, messages } = await getServerMessages((await params).locale);
  return privatePageMetadata({
  title: messages.authMetadataTitle,
  description: messages.authMetadataDescription,
  path: "/auth",
  locale,
  });
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
