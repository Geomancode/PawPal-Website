import type { Metadata } from "next";
import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import TagPageClient from "./TagPageClient";
import { publicPageMetadata } from "@/app/metadata";
import { loadP2W2TagFixture } from "@/lib/p2w2DynamicRouteFixtures";
import { getPetAgeYears } from "@/lib/petAge";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadTagPet(id: string) {
  const fixture = await loadP2W2TagFixture(id);
  if (fixture) return fixture;

  // Fetch pet data (public, no auth required)
  const { data: pet, error } = await supabase
    .from("pets")
    .select("id, name, breed, birth_date, avatar_url, social_traits, blood_type, owner_contact, created_at, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!pet) return null;

  // Fetch owner display name
  const { data: owner, error: ownerError } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url")
    .eq("id", pet.owner_id)
    .maybeSingle();

  if (ownerError) throw ownerError;

  return { pet: { ...pet, age: getPetAgeYears(pet.birth_date) }, owner };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadTagPet(id);
  if (!data) {
    return {
      title: "PawPal tag not found",
      description:
        "This PawPal tag link is missing, private, or no longer available. Check the NFC or QR link again.",
      alternates: {
        canonical: `/tag/${id}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const ownerName = data.owner?.display_name ?? data.owner?.username ?? "their owner";
  const description = `${data.pet.name} has a PawPal safety profile. Help ${data.pet.name} get back to ${ownerName} safely.`;

  return publicPageMetadata({
    title: `${data.pet.name} PawPal safety profile`,
    description,
    path: `/tag/${id}`,
  });
}

export default async function TagPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadTagPet(id);
  if (!data) return notFound();

  return <TagPageClient pet={data.pet} owner={data.owner} />;
}
