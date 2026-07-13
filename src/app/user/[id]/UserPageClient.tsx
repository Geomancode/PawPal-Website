"use client";

import Image from "next/image";
import Link from "next/link";
import PawIcon from "@/components/icons/PawIcon";

import { AppDeepLinkButton } from "@/components/ui";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

type UserPageClientProps = {
  id: string;
  profile: {
    display_name?: string | null;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    paw_points?: number | null;
    location_city?: string | null;
    is_verified?: boolean | null;
  };
  pets: Array<{
    id: string;
    name: string;
    species_group?: string | null;
    breed?: string | null;
    avatar_url?: string | null;
  }>;
  postCount: number;
};

export default function UserPageClient({
  id,
  profile,
  pets,
  postCount,
}: UserPageClientProps) {
  const { loader, t } = useRouteTranslations();
  const name =
    profile.display_name ??
    profile.full_name ??
    profile.username ??
    t("userPageMemberFallback");
  const username = profile.username ? `@${profile.username}` : "PawPal";

  return (
    <section className="bg-paw-page px-4 pb-10 pt-24 text-paw-ink sm:px-6 sm:pb-14 sm:pt-28">
      {loader}
      <div className="mx-auto max-w-4xl overflow-hidden rounded-paw-lg border border-paw-border bg-paw-panel shadow-paw-panel">
        <div className="bg-gradient-to-r from-paw-primary to-paw-accent px-6 py-10 text-center text-paw-on-primary">
          <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-paw-panel/70 bg-paw-panel/20">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={name}
                fill
                sizes="96px"
                unoptimized
                priority
                className="object-cover"
              />
            ) : (
              <PawIcon name="paw" className="m-7 h-10 w-10" />
            )}
          </div>
          <h1 className="mt-4 font-brand text-paw-type-h1 font-extrabold">{name}</h1>
          <p className="public-profile-username mt-1 text-paw-type-body font-extrabold text-paw-on-primary">{username}</p>
          {profile.bio && (
            <p className="public-profile-bio mx-auto mt-4 max-w-xl text-paw-type-body font-medium leading-6 text-paw-on-primary">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <Stat label={t("userPagePostsLabel")} value={postCount} />
              <Stat label={t("userPagePetsLabel")} value={pets.length} />
              <Stat label={t("userPagePawPointsLabel")} value={profile.paw_points ?? 0} />
            </div>

            <div>
              <h2 className="font-brand text-paw-type-h2 font-extrabold">{t("userPagePetsLabel")}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {pets.length === 0 ? (
                  <p className="rounded-paw-md bg-paw-panel-subtle p-4 text-paw-type-body text-paw-muted">
                    {t("userPageNoPublicPets")}
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
                            loading="lazy"
                            className="object-cover"
                          />
                        ) : (
                          <PawIcon name="paw" className="m-3 h-6 w-6 text-paw-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold">{pet.name}</p>
                        <p className="text-paw-type-caption text-paw-muted">
                          {pet.breed ?? pet.species_group ?? t("userPagePetFallback")}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-paw-lg border border-paw-border bg-paw-panel-subtle p-5">
            <div className="flex items-center gap-2 text-paw-type-body font-extrabold text-paw-primary">
              <PawIcon name="appLink" className="h-4 w-4" />
              {t("userPageOpenInPawPal")}
            </div>
            <p className="mt-3 text-paw-type-body leading-6 text-paw-body">
              {t("userPageOpenDescription")}
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <AppDeepLinkButton href={`pawpal://user/${id}`} fallbackHref={`/user/${id}`} />
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-paw-md border border-paw-border bg-paw-panel px-4 text-paw-type-body font-extrabold"
              >
                {t("userPageInstallPawPal")}
              </Link>
            </div>
            <div className="mt-5 space-y-2 text-paw-type-caption text-paw-muted">
              {profile.location_city && (
                <p className="flex items-center gap-1.5">
                  <PawIcon name="location" className="h-3.5 w-3.5" />
                  {profile.location_city}
                </p>
              )}
              {profile.is_verified && (
                <p className="flex items-center gap-1.5">
                  <PawIcon name="verified" className="h-3.5 w-3.5" />
                  {t("userPageVerifiedProfile")}
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
      <p className="text-paw-type-h2 font-extrabold text-paw-primary">{value}</p>
      <p className="text-paw-type-caption font-bold text-paw-muted">{label}</p>
    </div>
  );
}
