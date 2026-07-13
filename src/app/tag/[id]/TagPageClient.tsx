"use client";

import Image from "next/image";
import Link from "next/link";
import PawIcon, { type PawIconName } from "@/components/icons/PawIcon";
import { AppDeepLinkButton, Badge, Card, StatusMessage } from "@/components/ui";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

type PetSocialTraits = {
  health_badges?: string[];
  social_tags?: string[];
  quirk?: string;
  achievements?: string[];
  [key: string]: unknown;
};

const Droplets = "humidity" satisfies PawIconName;

interface TagPageClientProps {
  pet: {
    id: string;
    name: string;
    breed: string | null;
    age: number | null;
    avatar_url: string | null;
    social_traits: PetSocialTraits | null;
    blood_type: string | null;
    owner_contact: string | null;
    created_at: string;
  };
  owner: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  } | null;
}

export default function TagPageClient({ pet, owner }: TagPageClientProps) {
  const { loader, t } = useRouteTranslations();
  const healthBadges: string[] = pet.social_traits?.health_badges ?? [];
  const socialTags: string[] = pet.social_traits?.social_tags ?? [];
  const quirk: string | undefined = pet.social_traits?.quirk;
  const achievements: string[] = pet.social_traits?.achievements ?? [];
  const ownerName = owner?.display_name || owner?.username || t("tagPageOwnerFallback");
  const ownerLabel = owner ? ownerName : t("tagPageOwnerNotPublic");
  const contactHref = pet.owner_contact
    ? pet.owner_contact.includes("@")
      ? `mailto:${pet.owner_contact}`
      : `tel:${pet.owner_contact}`
    : null;
  const contactIsEmail = pet.owner_contact?.includes("@") ?? false;
  const contactIcon: PawIconName = contactIsEmail ? "mail" : "phone";
  const contactType = contactHref
    ? contactIsEmail
      ? t("tagPagePublicEmail")
      : t("tagPagePublicPhone")
    : t("tagPageContactHidden");
  const ageLabel =
    pet.age != null
      ? t(pet.age === 1 ? "tagPageAgeYear" : "tagPageAgeYears").replace(
          "{age}",
          String(pet.age),
        )
      : t("tagPageNotListed");
  const careLabel = healthBadges[0] ?? t("tagPageNoPublicNotes");

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-paw-page px-paw-md py-8 pt-24 text-paw-ink sm:px-paw-xl lg:px-paw-xxl">
      {loader}
      <main className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <section className="tag-rescue-panel">
          <div className="relative z-10 flex h-full flex-col">
            <p className="inline-flex w-fit items-center gap-2 rounded-paw-sm border border-paw-primary/20 bg-paw-primary-soft px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-paw-primary">
              <PawIcon name="nfcScan" className="h-4 w-4" aria-hidden="true" />
              {t("tagPageScannedBadge")}
            </p>

            <div className="mt-4 flex items-start gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-paw-lg border-4 border-paw-panel bg-paw-primary-soft text-paw-on-primary-soft shadow-paw-panel sm:h-24 sm:w-24">
                {pet.avatar_url ? (
                  <Image
                    src={pet.avatar_url}
                    alt={pet.name}
                    fill
                    sizes="96px"
                    unoptimized
                    priority
                    className="object-cover"
                  />
                ) : (
                  <PawIcon name="paw" className="h-10 w-10" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="break-words font-brand text-3xl font-extrabold leading-tight text-paw-ink sm:text-4xl">
                  {t("tagPageHelpPetGetHome").replace("{petName}", pet.name)}
                </h1>
                <p className="mt-2 text-sm font-bold leading-6 text-paw-body">
                  {t("tagPageSafetyProfileManagedBy").replace(
                    "{ownerLabel}",
                    ownerLabel,
                  )}
                </p>
              </div>
            </div>

            {contactHref ? (
              <div className="mt-5">
                <a
                  href={contactHref}
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-paw-md bg-paw-primary px-5 text-base font-extrabold text-paw-accent-ink shadow-paw-action transition hover:bg-paw-primary-hover"
                >
                  <PawIcon name={contactIcon} className="h-5 w-5" aria-hidden="true" />
                  {t("tagPageContactOwnerNow")}
                </a>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-paw-muted">
                  {t(
                    contactIsEmail
                      ? "tagPageOwnerSharedPublicEmail"
                      : "tagPageOwnerSharedPublicPhone",
                  )}
                </p>
              </div>
            ) : (
              <StatusMessage tone="warning" variant="compact" className="mt-7" title={t("tagPageContactHiddenTitle")}>
                {t("tagPageContactHiddenBody")}
              </StatusMessage>
            )}

            <div className="tag-mini-facts mt-4 grid grid-cols-2 gap-2">
              <MiniFact label={t("tagPageBreedLabel")} value={pet.breed ?? t("tagPageNotListed")} />
              <MiniFact label={t("tagPageAgeLabel")} value={ageLabel} />
              <MiniFact label={t("tagPageBloodLabel")} value={pet.blood_type ?? t("tagPageNotListed")} />
              <MiniFact label={t("tagPageCareLabel")} value={careLabel} />
            </div>

            <StatusMessage
              tone="warning"
              variant="compact"
              className="mt-4"
              title={t("tagPageUrgentTitle")}
            >
                {t("tagPageUrgentBody")}
            </StatusMessage>
          </div>
        </section>

        <section className="space-y-4">
          <Card variant="panel" className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-paw-muted">
                  {t("tagPageCriticalDetails")}
                </p>
                <h2 className="mt-1 break-words text-2xl font-extrabold text-paw-ink">
                  {t("tagPageBeforeMovingPet").replace("{petName}", pet.name)}
                </h2>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-paw-sm bg-paw-primary-soft text-paw-on-primary-soft">
                <PawIcon name="shield" className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoTile label={t("tagPageContactLabel")} value={contactType} icon={contactIcon} />
              <InfoTile label={t("tagPageBreedLabel")} value={pet.breed ?? t("tagPageNotListed")} icon="paw" />
              <InfoTile label={t("tagPageAgeLabel")} value={ageLabel} icon="calendar" />
              <InfoTile label={t("tagPageBloodLabel")} value={pet.blood_type ?? t("tagPageNotListed")} icon={Droplets} tone="critical" />
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <TagSection
              icon="shield"
              title={t("tagPageHealthAndCare")}
              values={healthBadges}
              tone="success"
              emptyText={t("tagPageHealthEmpty")}
            />
            <TagSection
              icon="heart"
              title={t("tagPagePersonality")}
              values={socialTags}
              tone="trust"
              emptyText={t("tagPagePersonalityEmpty")}
            />
          </div>

          {quirk && (
            <Card variant="panel" className="p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-paw-muted">
                {t("tagPageBehaviorNote")}
              </p>
              <p className="mt-2 text-sm italic leading-6 text-paw-body">
                &ldquo;{quirk}&rdquo;
              </p>
            </Card>
          )}

          <Card variant="panel" className="p-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-paw-sm bg-paw-primary-soft text-paw-on-primary-soft">
                <PawIcon name="person" className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-paw-muted">
                  {t("tagPageOwnerAndNextSteps")}
                </p>
                <p className="mt-1 break-words text-sm font-extrabold text-paw-ink">
                  {ownerLabel}
                </p>
                <p className="mt-1 text-sm leading-6 text-paw-body">
                  {t("tagPageSecondaryActions")}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <AppDeepLinkButton
                href={`pawpal://tag/${pet.id}`}
                fallbackHref="/"
                className="border border-paw-border bg-paw-panel text-paw-ink shadow-none hover:border-paw-primary hover:bg-paw-primary-soft"
              >
                {t("tagPageOpenInPawPal")}
              </AppDeepLinkButton>
              <Link
                href="/store"
                className="inline-flex h-12 items-center justify-center rounded-paw-md border border-paw-border bg-paw-panel px-4 text-sm font-extrabold text-paw-ink transition hover:border-paw-primary hover:text-paw-primary sm:h-full"
              >
                {t("tagPageGetTag")}
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-paw-muted">
              {t("tagPageDownloadApp")}
            </p>
          </Card>

          <TagSection
            icon="award"
            title={t("tagPageAchievements")}
            values={achievements}
            tone="primary"
            emptyText={t("tagPageAchievementsEmpty")}
          />
        </section>
      </main>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="tag-mini-fact min-w-0 rounded-paw-sm border border-paw-border bg-paw-panel-subtle px-3 py-2">
      <span className="block text-paw-type-caption font-black uppercase tracking-[0.12em] text-paw-muted">
        {label}
      </span>
      <span className="mt-0.5 block break-words text-xs font-extrabold leading-5 text-paw-ink">
        {value}
      </span>
    </div>
  );
}

function InfoTile({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: PawIconName;
  tone?: "primary" | "critical";
}) {
  return (
    <div className={tone === "critical" ? "tag-info-tile tag-info-tile-critical" : "tag-info-tile"}>
      <PawIcon name={icon} className="h-4 w-4" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-paw-type-caption font-black uppercase tracking-[0.12em] text-paw-muted">
          {label}
        </span>
        <span className="mt-0.5 block break-words text-sm font-extrabold text-paw-ink">
          {value}
        </span>
      </span>
    </div>
  );
}

function TagSection({
  icon,
  title,
  values,
  tone,
  emptyText,
}: {
  icon: PawIconName;
  title: string;
  values: string[];
  tone: "primary" | "success" | "trust";
  emptyText: string;
}) {
  return (
    <Card variant="panel" className="p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-paw-muted">
        <PawIcon name={icon} className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value, index) => (
            <Badge
              key={`${value}-${index}`}
              tone={tone}
              variant="semantic"
              size="sm"
              className="max-w-full whitespace-normal text-left leading-5"
            >
              {value}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="rounded-paw-sm border border-dashed border-paw-border bg-paw-panel-subtle px-3 py-2 text-sm leading-6 text-paw-body">
          {emptyText}
        </p>
      )}
    </Card>
  );
}
