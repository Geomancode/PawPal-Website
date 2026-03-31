import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import TagPageClient from "./TagPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TagPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch pet data (public, no auth required)
  const { data: pet, error } = await supabase
    .from("pets")
    .select("id, name, breed, age, avatar_url, social_traits, blood_type, owner_contact, created_at, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (!pet || error) return notFound();

  // Fetch owner display name
  const { data: owner } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url")
    .eq("id", pet.owner_id)
    .maybeSingle();

  return <TagPageClient pet={pet} owner={owner} />;
}
