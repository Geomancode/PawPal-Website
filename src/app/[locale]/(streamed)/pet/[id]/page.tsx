import { redirect } from "next/navigation";
import { defaultLocale, isLocale } from "@/i18n/locales";
import { localizedPath } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function SharedPetAliasPage({ params }: PageProps) {
  const { locale, id } = await params;
  redirect(localizedPath(`/tag/${id}`, isLocale(locale) ? locale : defaultLocale));
}
