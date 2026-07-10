import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UsersRound, PawPrint } from "lucide-react";

import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { AppDeepLinkButton, Badge, Card, CardContent, buttonClassName } from "@/components/ui";
import { publicPageMetadata } from "@/app/metadata";
import { loadP2W2GroupFixture } from "@/lib/p2w2DynamicRouteFixtures";

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

  const { group, memberCount } = data;

  return (
    <section className="deep-page-shell bg-paw-page px-4 pb-16 pt-24 text-paw-ink sm:px-6 sm:pb-24 sm:pt-28">
      <Card className="mx-auto max-w-3xl text-center">
        <CardContent className="p-paw-xl sm:p-paw-xxl">
        <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-paw-xl bg-paw-primary-soft text-paw-on-primary-soft shadow-paw-panel">
          {group.avatar_url ? (
            <Image
              src={group.avatar_url}
              alt={group.name}
              fill
              sizes="96px"
              unoptimized
              priority
              className="object-cover"
            />
          ) : (
            <UsersRound className="m-7 h-10 w-10" />
          )}
        </div>
        <Badge tone="primary" className="mt-6">PawPal group invite</Badge>
        <h1 className="mt-2 font-brand text-3xl font-extrabold sm:text-4xl">
          {group.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-paw-body">
          Join this group in PawPal to chat, share pet moments, and coordinate
          walks with the community.
        </p>

        <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-3 rounded-paw-xl border border-paw-outline-variant bg-paw-panel-subtle px-paw-md py-paw-sm text-sm font-bold text-paw-body shadow-paw-panel">
          <PawPrint className="h-4 w-4 text-paw-on-primary-soft" />
          {memberCount} member{memberCount === 1 ? "" : "s"}
        </div>

        <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3">
          <AppDeepLinkButton href={`pawpal://group/${id}`} fallbackHref={`/group/${id}`} />
          <Link
            href="/"
            className={buttonClassName({ variant: "secondary", size: "lg" })}
          >
            Install PawPal
          </Link>
        </div>
        </CardContent>
      </Card>
    </section>
  );
}
