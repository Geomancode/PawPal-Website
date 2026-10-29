import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { publicPageMetadata } from "@/app/metadata";
import { loadP2W2GroupFixture } from "@/lib/p2w2DynamicRouteFixtures";
import GroupPageClient from "@/app/group/[id]/GroupPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadGroup(id: string) {
  const fixture = await loadP2W2GroupFixture(id);
  if (fixture) return fixture;

  const { data: group, error } = await supabase
    .from("groups")
    .select("id, name, avatar_url, owner_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!group) return null;

  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", id)
    .limit(500);

  if (membersError) throw membersError;

  return {
    group,
    memberCount: members?.length ?? 0,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadGroup(id);
  if (!data) return { title: "PawPal Group" };

  return publicPageMetadata({
    title: `${data.group.name} on PawPal`,
    description: `Join ${data.group.name}, a PawPal group for pet people.`,
    path: `/group/${id}`,
  });
}

export default async function SharedGroupPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadGroup(id);
  if (!data) return notFound();

  return <GroupPageClient id={id} {...data} />;
}
