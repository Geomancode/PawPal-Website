"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  Calendar,
  Droplets,
  Heart,
  Mail,
  PawPrint,
  Phone,
  ScanLine,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppDeepLinkButton, StatusMessage } from "@/components/ui";

type PetSocialTraits = {
  health_badges?: string[];
  social_tags?: string[];
  quirk?: string;
  achievements?: string[];
  [key: string]: unknown;
};

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
  const healthBadges: string[] = pet.social_traits?.health_badges ?? [];
  const socialTags: string[] = pet.social_traits?.social_tags ?? [];
  const quirk: string | undefined = pet.social_traits?.quirk;
  const achievements: string[] = pet.social_traits?.achievements ?? [];
  const ownerName = owner?.display_name || owner?.username || "PawPal owner";
  const ownerLabel = owner ? ownerName : "Owner profile not public";
  const contactHref = pet.owner_contact
    ? pet.owner_contact.includes("@")
      ? `mailto:${pet.owner_contact}`
      : `tel:${pet.owner_contact}`
    : null;
  const contactIsEmail = pet.owner_contact?.includes("@") ?? false;
  const ContactIcon = contactIsEmail ? Mail : Phone;
  const contactType = contactHref
    ? contactIsEmail
      ? "Public email"
      : "Public phone"
    : "Contact hidden";
  const ageLabel =
    pet.age != null ? `${pet.age} year${pet.age === 1 ? "" : "s"}` : "Not listed";
  const careLabel = healthBadges[0] ?? "No public notes";

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-paw-page px-4 py-8 pt-24 text-paw-ink">
      <main className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <section className="tag-rescue-panel">
          <div className="relative z-10 flex h-full flex-col">
            <p className="inline-flex w-fit items-center gap-2 rounded-paw-sm border border-paw-primary/20 bg-paw-primary-soft px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-paw-primary">
              <ScanLine className="h-4 w-4" aria-hidden="true" />
              Scanned PawPal tag
            </p>

            <div className="mt-4 flex items-start gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-paw-lg border-4 border-white bg-paw-primary-soft text-paw-primary shadow-paw-panel sm:h-24 sm:w-24">
                {pet.avatar_url ? (
                  <Image
                    src={pet.avatar_url}
                    alt={pet.name}
                    fill
                    sizes="96px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <PawPrint className="h-10 w-10" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="break-words font-brand text-3xl font-extrabold leading-tight text-paw-ink sm:text-4xl">
                  Help {pet.name} get home.
                </h1>
                <p className="mt-2 text-sm font-bold leading-6 text-paw-body">
                  Safety profile managed by {ownerLabel}.
                </p>
              </div>
            </div>

            {contactHref ? (
              <div className="mt-5">
                <a
                  href={contactHref}
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-paw-md bg-paw-primary px-5 text-base font-extrabold text-white shadow-paw-action transition hover:bg-paw-primary-hover"
                >
                  <ContactIcon className="h-5 w-5" aria-hidden="true" />
                  Contact owner now
                </a>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-paw-muted">
                  Owner shared a {contactIsEmail ? "public email" : "public phone"} for this tag
                </p>
              </div>
            ) : (
              <StatusMessage tone="warning" className="mt-7" title="Owner contact is hidden">
                This profile is available, but direct contact details are not public right now.
              </StatusMessage>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniFact label="Breed" value={pet.breed ?? "Not listed"} />
              <MiniFact label="Age" value={ageLabel} />
              <MiniFact label="Blood" value={pet.blood_type ?? "Not listed"} />
              <MiniFact label="Care" value={careLabel} />
            </div>

            <div className="mt-4 rounded-paw-md border border-paw-warning/25 bg-paw-warning-soft p-4 text-sm leading-6 text-paw-body">
              <p className="flex items-start gap-2 font-extrabold text-paw-ink">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-paw-warning" aria-hidden="true" />
                If this looks urgent, contact local services first.
              </p>
              <p className="mt-1">
                PawPal only shows owner-approved profile details to support a safe return.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="tag-detail-card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-paw-muted">
                  Critical details
                </p>
                <h2 className="mt-1 break-words text-2xl font-extrabold text-paw-ink">
                  What to know before moving {pet.name}
                </h2>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-paw-sm bg-paw-primary-soft text-paw-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoTile label="Contact" value={contactType} icon={ContactIcon} />
              <InfoTile label="Breed" value={pet.breed ?? "Not listed"} icon={PawPrint} />
              <InfoTile label="Age" value={ageLabel} icon={Calendar} />
              <InfoTile label="Blood" value={pet.blood_type ?? "Not listed"} icon={Droplets} tone="danger" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TagSection
              icon={ShieldCheck}
              title="Health and care"
              values={healthBadges}
              tone="success"
              emptyText="No public health or care notes are listed for this tag."
            />
            <TagSection
              icon={Heart}
              title="Personality"
              values={socialTags}
              tone="trust"
              emptyText="No public personality notes are listed for this tag."
            />
          </div>

          {quirk && (
            <div className="tag-detail-card">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-paw-muted">
                Behavior note
              </p>
              <p className="mt-2 text-sm italic leading-6 text-paw-body">
                &ldquo;{quirk}&rdquo;
              </p>
            </div>
          )}

          <div className="tag-detail-card">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-paw-sm bg-paw-primary-soft text-paw-primary">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-paw-muted">
                  Owner and next steps
                </p>
                <p className="mt-1 break-words text-sm font-extrabold text-paw-ink">
                  {ownerLabel}
                </p>
                <p className="mt-1 text-sm leading-6 text-paw-body">
                  Secondary actions are available after the rescue/contact state is clear.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <AppDeepLinkButton
                href={`pawpal://tag/${pet.id}`}
                fallbackHref="/"
                className="border border-paw-border bg-paw-panel text-paw-ink shadow-none hover:border-paw-primary hover:bg-paw-primary-soft"
              >
                Open this tag in PawPal
              </AppDeepLinkButton>
              <Link
                href="/store"
                className="inline-flex h-12 items-center justify-center rounded-paw-md border border-paw-border bg-paw-panel px-4 text-sm font-extrabold text-paw-ink transition hover:border-paw-primary hover:text-paw-primary sm:h-full"
              >
                Get a PawPal tag
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-paw-muted">
              Scanned a PawPal NFC tag? Download the app to create and control your own pet safety profile.
            </p>
          </div>

          <TagSection
            icon={Award}
            title="Achievements"
            values={achievements}
            tone="primary"
            emptyText="No public achievements are listed for this tag."
          />
        </section>
      </main>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-paw-sm border border-paw-border bg-paw-panel-subtle px-3 py-2">
      <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-paw-muted">
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
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "primary" | "danger";
}) {
  return (
    <div className={tone === "danger" ? "tag-info-tile tag-info-tile-danger" : "tag-info-tile"}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-paw-muted">
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
  icon: Icon,
  title,
  values,
  tone,
  emptyText,
}: {
  icon: LucideIcon;
  title: string;
  values: string[];
  tone: "primary" | "success" | "trust";
  emptyText: string;
}) {
  return (
    <div className="tag-detail-card">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-paw-muted">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value, index) => (
            <span key={`${value}-${index}`} className={`tag-chip tag-chip-${tone}`}>
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="rounded-paw-sm border border-dashed border-paw-border bg-paw-panel-subtle px-3 py-2 text-sm leading-6 text-paw-body">
          {emptyText}
        </p>
      )}
    </div>
  );
}
