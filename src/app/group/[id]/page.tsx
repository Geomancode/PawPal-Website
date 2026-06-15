import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UsersRound, PawPrint } from "lucide-react";

import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { AppDeepLinkButton } from "@/components/ui";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadGroup(id: string) {
  const { data: group, error } = await supabase
    .from("groups")
    .select("id, name, avatar_url, owner_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!group || error) return null;

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", id)
    .limit(500);

  return {
    group,
    memberCount: members?.length ?? 0,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadGroup(id);
  if (!data) return { title: "PawPal Group" };

  return {
    title: `${data.group.name} on PawPal`,
    description: `Join ${data.group.name}, a PawPal group for pet people.`,
    openGraph: {
      title: `${data.group.name} on PawPal`,
      description: `Join ${data.group.name}, a PawPal group for pet people.`,
      images: data.group.avatar_url ? [{ url: data.group.avatar_url }] : undefined,
      url: `https://pawpal.be/group/${id}`,
    },
  };
}

export default async function SharedGroupPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadGroup(id);
  if (!data) return notFound();

  const { group, memberCount } = data;

  return (
    <section className="bg-paw-page px-4 py-10 text-paw-ink sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl rounded-paw-lg border border-paw-border bg-paw-panel p-6 text-center shadow-paw-panel sm:p-8">
        <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-paw-lg bg-paw-primary-soft">
          {group.avatar_url ? (
            <Image
              src={group.avatar_url}
              alt={group.name}
              fill
              sizes="96px"
              unoptimized
              className="object-cover"
            />
          ) : (
            <UsersRound className="m-7 h-10 w-10 text-paw-primary" />
          )}
        </div>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-wide text-paw-primary">
          PawPal Group Invite
        </p>
        <h1 className="mt-2 font-brand text-3xl font-extrabold sm:text-4xl">
          {group.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-paw-body">
          Join this group in PawPal to chat, share pet moments, and coordinate
          walks with the community.
        </p>

        <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-3 rounded-paw-md bg-paw-panel-subtle px-4 py-3 text-sm font-bold text-paw-muted">
          <PawPrint className="h-4 w-4 text-paw-primary" />
          {memberCount} member{memberCount === 1 ? "" : "s"}
        </div>

        <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3">
          <AppDeepLinkButton href={`pawpal://group/${id}`} fallbackHref={`/group/${id}`} />
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-paw-md border border-paw-border bg-paw-panel-subtle px-5 text-sm font-extrabold text-paw-ink transition hover:border-paw-primary"
          >
            Install PawPal
          </Link>
        </div>
      </div>
    </section>
  );
}
