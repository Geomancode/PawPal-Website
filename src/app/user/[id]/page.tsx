import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, PawPrint, Smartphone } from "lucide-react";

import { supabaseServer as supabase } from "@/lib/supabaseServer";

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
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!profile || error) return null;

  const [{ data: pets }, { data: posts }] = await Promise.all([
    supabase
      .from("pets")
      .select("id, name, species_group, breed, avatar_url")
      .eq("owner_id", id)
      .eq("is_public", true)
      .limit(4),
    supabase.from("posts").select("id").eq("user_id", id).limit(200),
  ]);

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

  return {
    title: `${name} on PawPal`,
    description,
    openGraph: {
      title: `${name} on PawPal`,
      description,
      images: data.profile.avatar_url ? [{ url: data.profile.avatar_url }] : undefined,
      url: `https://pawpal.be/user/${id}`,
    },
  };
}

export default async function SharedUserPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadProfile(id);
  if (!data) return notFound();

  const { profile, pets, postCount } = data;
  const name = profile.display_name ?? profile.full_name ?? profile.username ?? "PawPal member";
  const username = profile.username ? `@${profile.username}` : "PawPal";

  return (
    <section className="bg-paw-page px-4 py-10 text-paw-ink sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-paw-lg border border-paw-border bg-paw-panel shadow-paw-panel">
        <div className="bg-gradient-to-r from-paw-primary to-paw-accent px-6 py-10 text-center text-white">
          <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-white/70 bg-white/20">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={name}
                fill
                sizes="96px"
                unoptimized
                className="object-cover"
              />
            ) : (
              <PawPrint className="m-7 h-10 w-10" />
            )}
          </div>
          <h1 className="mt-4 font-brand text-3xl font-extrabold">{name}</h1>
          <p className="mt-1 text-sm font-semibold text-white/80">{username}</p>
          {profile.bio && <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/85">{profile.bio}</p>}
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Posts" value={postCount} />
              <Stat label="Pets" value={pets.length} />
              <Stat label="PawPoints" value={profile.paw_points ?? 0} />
            </div>

            <div>
              <h2 className="font-brand text-xl font-extrabold">Pets</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {pets.length === 0 ? (
                  <p className="rounded-paw-md bg-paw-panel-subtle p-4 text-sm text-paw-muted">
                    No public pets yet.
                  </p>
                ) : (
                  pets.map((pet) => (
                    <Link
                      key={pet.id}
                      href={`/tag/${pet.id}`}
                      className="flex items-center gap-3 rounded-paw-md border border-paw-border bg-paw-panel-subtle p-3 transition hover:border-paw-primary"
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-paw-md bg-paw-primary-soft">
                        {pet.avatar_url ? (
                          <Image
                            src={pet.avatar_url}
                            alt={pet.name}
                            fill
                            sizes="48px"
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <PawPrint className="m-3 h-6 w-6 text-paw-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold">{pet.name}</p>
                        <p className="text-xs text-paw-muted">
                          {pet.breed ?? pet.species_group ?? "Pet"}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-paw-lg border border-paw-border bg-paw-panel-subtle p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-paw-primary">
              <Smartphone className="h-4 w-4" />
              Open in PawPal
            </div>
            <p className="mt-3 text-sm leading-6 text-paw-body">
              Open this profile in the app to add friends, message, and see the full
              community experience.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <a
                href={`pawpal://user/${id}`}
                className="inline-flex h-11 items-center justify-center rounded-paw-md bg-paw-primary px-4 text-sm font-extrabold text-white shadow-paw-action transition hover:bg-paw-primary-hover"
              >
                Open in App
              </a>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-paw-md border border-paw-border bg-paw-panel px-4 text-sm font-extrabold"
              >
                Install PawPal
              </Link>
            </div>
            <div className="mt-5 space-y-2 text-xs text-paw-muted">
              {profile.location_city && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.location_city}
                </p>
              )}
              {profile.is_verified && (
                <p className="flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified PawPal profile
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-paw-md bg-paw-primary-soft px-3 py-4 text-center">
      <p className="text-xl font-extrabold text-paw-primary">{value}</p>
      <p className="text-xs font-bold text-paw-muted">{label}</p>
    </div>
  );
}
