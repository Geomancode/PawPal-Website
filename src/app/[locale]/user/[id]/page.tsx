import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { getPublicProfileView } from "@/lib/profileViews";
import { publicPageMetadata } from "@/app/metadata";
import { loadP2W2UserFixture } from "@/lib/p2w2DynamicRouteFixtures";
import { getServerMessages } from "@/i18n/serverMessages";
import UserPageClient from "@/app/user/[id]/UserPageClient";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

type PetPreview = {
  id: string;
  name: string;
  species_group?: string | null;
  breed?: string | null;
  avatar_url?: string | null;
};

async function loadProfile(id: string) {
  const fixture = await loadP2W2UserFixture(id);
  if (fixture) return { ...fixture, isPublic: true };

  const view = await getPublicProfileView(supabase, id);
  if (!view) return null;
  const { profile, isPublic } = view;
  if (!isPublic) {
    return { profile, isPublic: false, pets: [] as PetPreview[], postCount: 0 };
  }

  const [
    { data: pets, error: petsError },
    { data: posts, error: postsError },
  ] = await Promise.all([
    supabase
      .from("pets")
      .select("id, name, species_group, breed, avatar_url")
      .eq("owner_id", id)
      .eq("is_public", true)
      .limit(4),
    supabase.from("posts").select("id").eq("user_id", id).limit(200),
  ]);

  if (petsError) throw petsError;
  if (postsError) throw postsError;

  return {
    profile,
    isPublic: true,
    pets: (pets ?? []) as PetPreview[],
    postCount: posts?.length ?? 0,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale: requestedLocale } = await params;
  const { locale, messages } = await getServerMessages(requestedLocale);
  const data = await loadProfile(id);
  if (!data) return { title: "PawPal Profile" };

  const name =
    data.profile.display_name ?? data.profile.username ?? "PawPal";
  const description =
    data.isPublic
      ? data.profile.bio ?? `View ${name}'s public PawPal profile, pets, and posts.`
      : messages.tagPageOwnerNotPublic;

  return publicPageMetadata({
    title: `${name} on PawPal`,
    description,
    path: `/user/${id}`,
    locale,
  });
}

export default async function SharedUserPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadProfile(id);
  if (!data) return notFound();

  return <UserPageClient id={id} {...data} />;
}
