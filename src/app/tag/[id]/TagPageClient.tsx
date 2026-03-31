"use client";

import { motion } from "framer-motion";
import { Heart, Phone, Droplets, Shield, Award, MapPin, Calendar, PawPrint } from "lucide-react";

interface TagPageClientProps {
  pet: {
    id: string;
    name: string;
    breed: string | null;
    age: number | null;
    avatar_url: string | null;
    social_traits: Record<string, any> | null;
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

const SPECIES_EMOJI: Record<string, string> = {
  canine: "🐕", feline: "🐈", lagomorph: "🐰", bird: "🦜",
  reptile: "🦎", amphibian: "🐸", fish: "🐠", small_mammal: "🐹",
  insect: "🦋", arachnid: "🕷️", equine: "🐴", exotic_wild: "🦊",
};

export default function TagPageClient({ pet, owner }: TagPageClientProps) {
  const healthBadges: string[] = pet.social_traits?.health_badges ?? [];
  const socialTags: string[] = pet.social_traits?.social_tags ?? [];
  const quirk: string | undefined = pet.social_traits?.quirk;
  const achievements: string[] = pet.social_traits?.achievements ?? [];
  const emoji = "🐾";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-8 text-center relative">
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-xs text-white font-bold">PawPal Tag</span>
            </div>
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/30 border-4 border-white mx-auto flex items-center justify-center text-4xl shadow-lg">
              {pet.avatar_url ? (
                <img src={pet.avatar_url} alt={pet.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                emoji
              )}
            </div>
            <h1 className="text-xl font-extrabold text-white mt-3">{pet.name}</h1>
            {quirk && <p className="text-sm text-white/80 italic mt-1">&ldquo;{quirk}&rdquo;</p>}
          </div>

          {/* Info */}
          <div className="px-6 py-5 space-y-4">
            {/* Breed / Age row */}
            <div className="flex gap-3">
              {pet.breed && (
                <div className="flex-1 bg-amber-50 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Breed</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{pet.breed}</p>
                </div>
              )}
              {pet.age != null && (
                <div className="flex-1 bg-amber-50 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Age</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{pet.age} year{pet.age !== 1 ? "s" : ""}</p>
                </div>
              )}
              {pet.blood_type && (
                <div className="flex-1 bg-red-50 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Blood</p>
                  <p className="text-sm font-semibold text-red-600 mt-0.5 flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3" /> {pet.blood_type}
                  </p>
                </div>
              )}
            </div>

            {/* Health badges */}
            {healthBadges.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Health & Care
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {healthBadges.map((b) => (
                    <span key={b} className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium border border-emerald-100">{b}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Social tags */}
            {socialTags.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Personality
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {socialTags.map((t) => (
                    <span key={t} className="bg-violet-50 text-violet-700 text-xs px-2.5 py-1 rounded-full font-medium border border-violet-100">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {achievements.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Achievements
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {achievements.map((a) => (
                    <span key={a} className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium border border-amber-100">🏅 {a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Owner info */}
            {(owner || pet.owner_contact) && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Owner</p>
                {owner && (
                  <p className="text-sm font-semibold text-gray-800">{owner.display_name || owner.username}</p>
                )}
                {pet.owner_contact && (
                  <a
                    href={pet.owner_contact.includes("@") ? `mailto:${pet.owner_contact}` : `tel:${pet.owner_contact}`}
                    className="inline-flex items-center gap-1.5 mt-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Contact Owner
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <PawPrint className="w-3 h-3" />
              <span>PawPal</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>Since {new Date(pet.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Scanned a PawPal NFC tag? Download the app to create your pet&apos;s profile!
        </p>
      </motion.div>
    </div>
  );
}
