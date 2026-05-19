"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, Phone, Droplets, Shield, Award, Calendar, PawPrint, Smartphone } from "lucide-react";
import { DoodlePaw, DoodleHeart } from "@/components/PetDoodles";

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
  const emoji = "🐾";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-paw-page to-paw-panel-subtle px-4 py-12 text-paw-ink">
      {/* Pet doodles */}
      <div className="absolute top-[10%] right-[8%] hidden h-16 w-16 text-paw-primary/10 doodle-float md:block"><DoodlePaw className="h-full w-full" /></div>
      <div className="absolute bottom-[15%] left-[8%] hidden h-12 w-12 text-paw-primary/10 doodle-float-alt md:block" style={{ animationDelay: "2s" }}><DoodleHeart className="h-full w-full" /></div>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Card */}
        <div className="overflow-hidden rounded-paw-lg border border-paw-border bg-paw-panel/85 shadow-paw-panel backdrop-blur-xl">
          {/* Header gradient */}
          <div className="relative bg-gradient-to-r from-paw-primary to-paw-primary-hover px-6 py-8 text-center">
            <div className="absolute top-3 right-3 rounded-paw-sm bg-white/20 px-3 py-1 backdrop-blur-sm">
              <span className="text-xs text-white font-bold">PawPal Tag</span>
            </div>
            {/* Avatar */}
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-paw-lg border-4 border-white bg-white/30 text-4xl shadow-lg">
              {pet.avatar_url ? (
                <Image
                  src={pet.avatar_url}
                  alt={pet.name}
                  fill
                  sizes="80px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                emoji
              )}
            </div>
            <h1 className="text-xl font-extrabold text-white mt-3">{pet.name}</h1>
            {quirk && <p className="text-sm text-white/80 italic mt-1">&ldquo;{quirk}&rdquo;</p>}
          </div>

          {/* Info */}
          <div className="space-y-4 px-6 py-5">
            {/* Breed / Age row */}
            <div className="flex gap-3">
              {pet.breed && (
                <div className="flex-1 rounded-paw-md bg-paw-primary-soft px-3 py-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-paw-muted">Breed</p>
                  <p className="mt-0.5 text-sm font-semibold text-paw-ink">{pet.breed}</p>
                </div>
              )}
              {pet.age != null && (
                <div className="flex-1 rounded-paw-md bg-paw-primary-soft px-3 py-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-paw-muted">Age</p>
                  <p className="mt-0.5 text-sm font-semibold text-paw-ink">{pet.age} year{pet.age !== 1 ? "s" : ""}</p>
                </div>
              )}
              {pet.blood_type && (
                <div className="flex-1 rounded-paw-md bg-paw-danger-soft px-3 py-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-paw-muted">Blood</p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-sm font-semibold text-paw-danger">
                    <Droplets className="w-3 h-3" /> {pet.blood_type}
                  </p>
                </div>
              )}
            </div>

            {/* Health badges */}
            {healthBadges.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-paw-muted">
                  <Shield className="w-3 h-3" /> Health & Care
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {healthBadges.map((b) => (
                    <span key={b} className="rounded-paw-sm border border-paw-success/20 bg-paw-success-soft px-2.5 py-1 text-xs font-medium text-paw-success">{b}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Social tags */}
            {socialTags.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-paw-muted">
                  <Heart className="w-3 h-3" /> Personality
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {socialTags.map((t) => (
                    <span key={t} className="rounded-paw-sm border border-paw-trust/20 bg-paw-trust-soft px-2.5 py-1 text-xs font-medium text-paw-trust">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {achievements.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-paw-muted">
                  <Award className="w-3 h-3" /> Achievements
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {achievements.map((a) => (
                    <span key={a} className="rounded-paw-sm border border-paw-primary/20 bg-paw-primary-soft px-2.5 py-1 text-xs font-medium text-paw-primary">🏅 {a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Owner info */}
            {(owner || pet.owner_contact) && (
              <div className="mt-4 border-t border-paw-border pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-paw-muted">Owner</p>
                {owner && (
                  <p className="text-sm font-semibold text-paw-ink">{owner.display_name || owner.username}</p>
                )}
                {pet.owner_contact && (
                  <a
                    href={pet.owner_contact.includes("@") ? `mailto:${pet.owner_contact}` : `tel:${pet.owner_contact}`}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-paw-md bg-paw-primary px-4 py-2 text-sm font-bold text-white shadow-paw-action transition-all hover:bg-paw-primary-hover"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Contact Owner
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between bg-paw-primary-soft px-6 py-3">
            <div className="flex items-center gap-1.5 text-xs text-paw-muted">
              <PawPrint className="w-3 h-3" />
              <span>PawPal</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-paw-muted">
              <Calendar className="w-3 h-3" />
              <span>Since {new Date(pet.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 grid gap-2">
          <a
            href={`pawpal://tag/${pet.id}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-paw-md bg-paw-primary px-4 text-sm font-extrabold text-white shadow-paw-action transition hover:bg-paw-primary-hover"
          >
            <Smartphone className="h-4 w-4" />
            Open in App
          </a>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-paw-md border border-paw-border bg-paw-panel px-4 text-sm font-extrabold text-paw-ink transition hover:border-paw-primary"
          >
            Install PawPal
          </Link>
          <p className="text-center text-xs text-paw-muted">
            Scanned a PawPal NFC tag? Download the app to create your pet&apos;s profile.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
