import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { publicPageMetadata } from "@/app/metadata";
import { loadP2W2UserFixture } from "@/lib/p2w2DynamicRouteFixtures";
import UserPageClient from "./UserPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
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
  if (fixture) return fixture;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!profile) return null;

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
    pets: (pets ?? []) as PetPreview[],
    postCount: posts?.length ?? 0,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadProfile(id);
  if (!data) return { title: "PawPal Profile" };

  const name =
    data.profile.display_name ?? data.profile.full_name ?? data.profile.username ?? "PawPal";
  const description =
    data.profile.bio ?? `View ${name}'s public PawPal profile, pets, and posts.`;

  return publicPageMetadata({
    title: `${name} on PawPal`,
    description,
    path: `/user/${id}`,
  });
}

export default async function SharedUserPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadProfile(id);
  if (!data) return notFound();

  return <UserPageClient id={id} {...data} />;
}
