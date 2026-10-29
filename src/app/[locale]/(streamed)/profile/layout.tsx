import type { Metadata } from "next";
import { getServerMessages } from "@/i18n/serverMessages";
import { privatePageMetadata } from "@/app/metadata";

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale, messages } = await getServerMessages((await params).locale);
  return privatePageMetadata({
    title: messages.navProfile,
    description: messages.profileWorkspaceDescription,
    path: "/profile",
    locale,
  });
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
