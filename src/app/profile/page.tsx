"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle, MapPin, Shield, Award, PawPrint, Edit3, Save,
  X, Plus, Calendar, Droplets, Nfc, Star, ChevronRight, Loader2, Smartphone,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

/* ── Types ── */
interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  language_pref: string;
  location_city: string | null;
  trust_level: number;
  paw_points: number;
  is_verified: boolean;
  created_at: string;
}

interface Pet {
  id: string;
  name: string;
  breed: string | null;
  age: number | null;
  avatar_url: string | null;
  social_traits: Record<string, any> | null;
  blood_type: string | null;
  owner_contact: string | null;
  nfc_tag_uid: string | null;
  created_at: string;
}

/* ── Trust Level Config ── */
const TRUST_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Newcomer", color: "bg-gray-100 text-gray-600" },
  2: { label: "Friendly", color: "bg-blue-100 text-blue-600" },
  3: { label: "Trusted", color: "bg-green-100 text-green-600" },
  4: { label: "Veteran", color: "bg-purple-100 text-purple-600" },
  5: { label: "Legend", color: "bg-amber-100 text-amber-600" },
};

const SPECIES_OPTIONS = [
  { id: "canine", emoji: "🐕", label: "Dog" },
  { id: "feline", emoji: "🐈", label: "Cat" },
  { id: "lagomorph", emoji: "🐰", label: "Rabbit" },
  { id: "bird", emoji: "🦜", label: "Bird" },
  { id: "reptile", emoji: "🦎", label: "Reptile" },
  { id: "fish", emoji: "🐠", label: "Fish" },
  { id: "small_mammal", emoji: "🐹", label: "Small Mammal" },
  { id: "equine", emoji: "🐴", label: "Horse" },
  { id: "other", emoji: "🐾", label: "Other" },
];

const BLOOD_TYPES = ["Unknown", "DEA 1.1+", "DEA 1.1-", "DEA 1.2+", "DEA 3", "DEA 4", "DEA 5", "DEA 7", "Type A", "Type B", "Type AB"];
const SOCIAL_PRESETS = ["Friendly", "High Energy", "Slow to warm up", "Good with Kids", "Good with Dogs", "Not good with Cats", "Vocal", "Cuddly"];
const HEALTH_PRESETS = ["Fully Vaccinated", "Neutered", "Spayed", "Special Diet", "Allergies"];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCity, setEditCity] = useState("");

  // Add Pet form
  const [showAddPet, setShowAddPet] = useState(false);
  const [addingPet, setAddingPet] = useState(false);
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("canine");
  const [petBreed, setPetBreed] = useState("");
  const [petBloodType, setPetBloodType] = useState("");
  const [petContact, setPetContact] = useState("");
  const [petSocialTags, setPetSocialTags] = useState<string[]>([]);
  const [petHealthBadges, setPetHealthBadges] = useState<string[]>([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
  }, [user, authLoading, router]);

  // Fetch profile + pets
  useEffect(() => {
    if (!user) return;
    
    async function fetchData() {
      setLoading(true);
      const [profileRes, petsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("pets").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
        setEditName(profileRes.data.display_name || "");
        setEditBio(profileRes.data.bio || "");
        setEditCity(profileRes.data.location_city || "");
      }
      if (petsRes.data) setPets(petsRes.data as Pet[]);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  /* ── Save profile edits ── */
  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: editName.trim() || null,
      bio: editBio.trim() || null,
      location_city: editCity.trim() || null,
    }).eq("id", user.id);

    if (!error) {
      setProfile({ ...profile, display_name: editName.trim() || null, bio: editBio.trim() || null, location_city: editCity.trim() || null });
      setEditing(false);
    }
    setSaving(false);
  };

  /* ── Add pet ── */
  const handleAddPet = async () => {
    if (!user || !petName.trim()) return;
    setAddingPet(true);

    const traitsMap: Record<string, any> = {};
    if (petSocialTags.length > 0) traitsMap.social_tags = petSocialTags;
    if (petHealthBadges.length > 0) traitsMap.health_badges = petHealthBadges;

    const { data, error } = await supabase.from("pets").insert({
      owner_id: user.id,
      name: petName.trim(),
      breed: petBreed.trim() || null,
      blood_type: (petBloodType && petBloodType !== "Unknown") ? petBloodType : null,
      owner_contact: petContact.trim() || null,
      social_traits: Object.keys(traitsMap).length > 0 ? traitsMap : null,
    }).select("*").single();

    if (data && !error) {
      setPets((prev) => [data as Pet, ...prev]);
      // Reset form
      setPetName(""); setPetBreed(""); setPetBloodType(""); setPetContact("");
      setPetSocialTags([]); setPetHealthBadges([]); setPetSpecies("canine");
      setShowAddPet(false);
    }
    setAddingPet(false);
  };

  const toggleTag = (tag: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const trust = TRUST_LABELS[profile.trust_level] || TRUST_LABELS[1];
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* ── Profile Header Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6"
        >
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 relative">
            <div className="absolute inset-0 bg-black/5" />
            {profile.is_verified && (
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-white" />
                <span className="text-xs text-white font-bold">Verified</span>
              </div>
            )}
          </div>

          {/* Avatar + Info */}
          <div className="px-6 pb-6 relative">
            {/* Avatar */}
            <div className="-mt-12 mb-4 flex items-end justify-between">
              <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-3xl font-bold">
                    {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-medium transition-all border border-gray-200"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {editing ? (
                /* ── Edit Mode ── */
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Display Name</label>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your display name"
                      className="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bio</label>
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell others about yourself…" rows={3}
                      className="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">City</label>
                    <input value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="e.g. Ghent"
                      className="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save
                    </button>
                    <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-all">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ── View Mode ── */
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h1 className="text-2xl font-extrabold text-gray-900">{profile.display_name || profile.username}</h1>
                  <p className="text-sm text-gray-400">@{profile.username}</p>
                  {profile.bio && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profile.bio}</p>}

                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {profile.location_city && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                        <MapPin className="w-3 h-3" /> {profile.location_city}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold ${trust.color}`}>
                      <Shield className="w-3 h-3" /> {trust.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full font-semibold">
                      <PawPrint className="w-3 h-3" /> {profile.paw_points} Paw Points
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                      <Calendar className="w-3 h-3" /> Since {memberSince}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: PawPrint, label: "Pets", value: pets.length, color: "text-amber-500" },
            { icon: Award, label: "Trust Level", value: `${profile.trust_level}/5`, color: "text-purple-500" },
            { icon: Star, label: "Paw Points", value: profile.paw_points, color: "text-orange-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              <p className="text-xl font-extrabold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── My Pets ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-amber-500" /> My Pets
            </h2>
            <button
              onClick={() => setShowAddPet(!showAddPet)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-sm ${
                showAddPet
                  ? "bg-gray-100 text-gray-600 border-gray-200"
                  : "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
              }`}
            >
              {showAddPet ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showAddPet ? "Cancel" : "Add Pet"}
            </button>
          </div>

          {/* ── Add Pet Form ── */}
          <AnimatePresence>
            {showAddPet && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                  {/* Pet Name */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pet Name *</label>
                    <input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="e.g. Luna"
                      className="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                  </div>

                  {/* Species */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Species</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SPECIES_OPTIONS.map((s) => (
                        <button key={s.id} onClick={() => setPetSpecies(s.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                            petSpecies === s.id
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-300"
                          }`}>
                          <span>{s.emoji}</span> {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Breed + Blood Type row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Breed</label>
                      <input value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="e.g. Golden Retriever"
                        className="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Blood Type</label>
                      <select value={petBloodType} onChange={(e) => setPetBloodType(e.target.value)}
                        className="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all">
                        <option value="">Select...</option>
                        {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Owner Contact */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Owner Contact (phone / email)</label>
                    <input value={petContact} onChange={(e) => setPetContact(e.target.value)} placeholder="e.g. +32 412 345 678"
                      className="mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                  </div>

                  {/* Social Tags */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personality Tags</label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {SOCIAL_PRESETS.map((tag) => (
                        <button key={tag} onClick={() => toggleTag(tag, petSocialTags, setPetSocialTags)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                            petSocialTags.includes(tag)
                              ? "bg-violet-500 text-white border-violet-500"
                              : "bg-violet-50 text-violet-600 border-violet-100 hover:border-violet-300"
                          }`}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Health Badges */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Health &amp; Care</label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {HEALTH_PRESETS.map((tag) => (
                        <button key={tag} onClick={() => toggleTag(tag, petHealthBadges, setPetHealthBadges)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                            petHealthBadges.includes(tag)
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300"
                          }`}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NFC Info Banner */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-700">Want to write an NFC pet tag?</p>
                      <p className="text-xs text-blue-500 mt-0.5">Open the PawPal app on your phone to write pet info to an NFC tag. The data syncs automatically!</p>
                    </div>
                  </div>

                  {/* Submit */}
                  <button onClick={handleAddPet} disabled={addingPet || !petName.trim()}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                    {addingPet ? <Loader2 className="w-4 h-4 animate-spin" /> : <PawPrint className="w-4 h-4" />}
                    {addingPet ? "Saving..." : "Add Pet 🐾"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {pets.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center">
              <PawPrint className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No pets yet</p>
              <p className="text-xs text-gray-300 mt-1">Click the + button above to add your first pet!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pets.map((pet, i) => {
                const healthBadges: string[] = pet.social_traits?.health_badges ?? [];
                const socialTags: string[] = pet.social_traits?.social_tags ?? [];
                const quirk: string | undefined = pet.social_traits?.quirk;

                return (
                  <motion.div
                    key={pet.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4 p-5">
                      {/* Pet avatar */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                        {pet.avatar_url ? (
                          <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                        ) : "🐾"}
                      </div>

                      {/* Pet info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">{pet.name}</h3>
                          {pet.nfc_tag_uid && (
                            <span className="flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                              <Nfc className="w-2.5 h-2.5" /> NFC
                            </span>
                          )}
                        </div>

                        {quirk && <p className="text-xs text-gray-400 italic mt-0.5">&ldquo;{quirk}&rdquo;</p>}

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {pet.breed && (
                            <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">{pet.breed}</span>
                          )}
                          {pet.age != null && (
                            <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                              {pet.age} yr{pet.age !== 1 ? "s" : ""}
                            </span>
                          )}
                          {pet.blood_type && (
                            <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Droplets className="w-2.5 h-2.5" /> {pet.blood_type}
                            </span>
                          )}
                        </div>

                        {/* Health & Social badges */}
                        {(healthBadges.length > 0 || socialTags.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {healthBadges.map((b) => (
                              <span key={b} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">{b}</span>
                            ))}
                            {socialTags.map((t) => (
                              <span key={t} className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-100">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* View tag page */}
                      <a
                        href={`/tag/${pet.id}`}
                        target="_blank"
                        className="shrink-0 self-center text-gray-300 hover:text-amber-500 transition-colors"
                        title="View public tag page"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
