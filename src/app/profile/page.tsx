"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Shield, Award, PawPrint, Edit3, Save,
  X, Plus, Calendar, Droplets, Nfc, Star, ChevronRight, Loader2, Smartphone,
  AlertCircle, Download, CheckCircle,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { DoodlePaw, DoodleCat, DoodleBone } from "@/components/PetDoodles";

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

interface PetSocialTraits {
  social_tags?: string[];
  health_badges?: string[];
  quirk?: string;
  achievements?: string[];
  [key: string]: unknown;
}

interface Pet {
  id: string;
  name: string;
  species_group: string;
  breed: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  social_traits: PetSocialTraits | null;
  blood_type: string | null;
  owner_contact: string | null;
  nfc_tag_uid: string | null;
  created_at: string;
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

/** Compute age in years from an ISO date string. */
function computeAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

function profileDisplayName(user: User): string | null {
  const raw = user.user_metadata?.display_name ?? user.user_metadata?.full_name;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function fallbackUsername(user: User): string {
  const emailPrefix = user.email?.split("@")[0] ?? "pawpal";
  const safePrefix = emailPrefix.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  return `${safePrefix || "pawpal"}_${user.id.slice(0, 8)}`;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "");
    if (message) return message;
  }
  return "Something went wrong. Please try again.";
}

async function loadOrCreateProfile(user: User): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as Profile;

  const fallback = {
    id: user.id,
    username: fallbackUsername(user),
    display_name: profileDisplayName(user),
    avatar_url: null,
    bio: null,
    language_pref: "en",
    location_city: null,
    trust_level: 1,
    paw_points: 0,
    is_verified: false,
  };

  const { data: created, error: createError } = await supabase
    .from("profiles")
    .upsert(fallback, { onConflict: "id" })
    .select("*")
    .single();

  if (createError) throw createError;
  return created as Profile;
}

/* ── Trust Level Config ── */
const TRUST_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Newcomer", color: "bg-paw-panel-subtle text-paw-muted" },
  2: { label: "Friendly", color: "bg-paw-trust-soft text-paw-trust" },
  3: { label: "Trusted", color: "bg-paw-success-soft text-paw-success" },
  4: { label: "Veteran", color: "bg-paw-primary-soft text-paw-primary" },
  5: { label: "Legend", color: "bg-paw-warning-soft text-paw-warning" },
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
  const [profileError, setProfileError] = useState<string | null>(null);
  const [petError, setPetError] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

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

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    setIsInstalled(standalone);

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallStatus(null);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setInstallStatus("PawPal is installed on this device.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  // Fetch profile + pets
  useEffect(() => {
    if (!user) return;
    
    async function fetchData() {
      setLoading(true);
      setProfileError(null);
      try {
        const [profileData, petsRes] = await Promise.all([
          loadOrCreateProfile(user!),
          supabase.from("pets").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false }),
        ]);

        setProfile(profileData);
        setEditName(profileData.display_name || "");
        setEditBio(profileData.bio || "");
        setEditCity(profileData.location_city || "");

        if (petsRes.error) throw petsRes.error;
        setPets((petsRes.data ?? []) as Pet[]);
      } catch (e) {
        setProfileError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  /* ── Save profile edits ── */
  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    setProfileError(null);
    const { error } = await supabase.from("profiles").update({
      display_name: editName.trim() || null,
      bio: editBio.trim() || null,
      location_city: editCity.trim() || null,
    }).eq("id", user.id);

    if (!error) {
      setProfile({ ...profile, display_name: editName.trim() || null, bio: editBio.trim() || null, location_city: editCity.trim() || null });
      setEditing(false);
    } else {
      setProfileError(errorMessage(error));
    }
    setSaving(false);
  };

  /* ── Add pet ── */
  const handleAddPet = async () => {
    if (!user || !petName.trim()) return;
    setAddingPet(true);
    setPetError(null);

    const traitsMap: PetSocialTraits = {};
    if (petSocialTags.length > 0) traitsMap.social_tags = petSocialTags;
    if (petHealthBadges.length > 0) traitsMap.health_badges = petHealthBadges;

    const { data, error } = await supabase.from("pets").insert({
      owner_id: user.id,
      name: petName.trim(),
      species_group: petSpecies,
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
    } else if (error) {
      setPetError(errorMessage(error));
    }
    setAddingPet(false);
  };

  const toggleTag = (tag: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  const handleInstall = async () => {
    if (isInstalled) {
      setInstallStatus("PawPal is already installed on this device.");
      return;
    }

    if (!installPrompt) {
      setInstallStatus("Open your browser menu and choose Add to Home Screen.");
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallStatus(
      choice.outcome === "accepted"
        ? "PawPal is installing now."
        : "Install dismissed. You can try again from the browser menu."
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paw-page pt-20">
        <Loader2 className="w-8 h-8 text-paw-primary animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paw-page px-4 pt-20">
        <div className="max-w-md rounded-paw-lg border border-paw-danger/20 bg-paw-panel p-6 text-center shadow-paw-panel">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-paw-danger" />
          <h1 className="text-lg font-extrabold text-paw-ink">Profile unavailable</h1>
          <p className="mt-2 text-sm text-paw-muted">{profileError ?? "We could not load your profile."}</p>
        </div>
      </div>
    );
  }

  const trust = TRUST_LABELS[profile.trust_level] || TRUST_LABELS[1];
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" });

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-paw-page to-paw-panel-subtle pt-24 pb-16 overflow-hidden">
      {/* Pet doodles */}
      <div className="absolute top-28 right-[5%] w-16 h-16 text-paw-primary/10 doodle-float hidden lg:block"><DoodlePaw className="w-full h-full" /></div>
      <div className="absolute top-[40%] left-[3%] w-14 h-14 text-paw-primary/8 doodle-float-alt hidden lg:block" style={{ animationDelay: '2s' }}><DoodleCat className="w-full h-full" /></div>
      <div className="absolute bottom-[15%] right-[4%] w-20 h-10 text-paw-trust/8 doodle-float hidden lg:block" style={{ animationDelay: '3s' }}><DoodleBone className="w-full h-full" /></div>
      <div className="max-w-4xl mx-auto px-4">
        {profileError && (
          <div className="mb-4 flex items-center gap-2 rounded-paw-md border border-paw-danger/20 bg-paw-danger-soft px-4 py-3 text-sm font-medium text-paw-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {profileError}
          </div>
        )}

        {/* ── Profile Header Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-paw-panel rounded-paw-lg shadow-paw-panel border border-paw-border overflow-hidden mb-6"
        >
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-paw-primary via-paw-warning to-paw-trust relative">
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
              <div className="w-24 h-24 rounded-paw-lg bg-paw-panel border-4 border-paw-panel shadow-lg flex items-center justify-center text-4xl overflow-hidden">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-paw-primary to-paw-primary-hover flex items-center justify-center text-white text-3xl font-bold">
                    {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-paw-panel-subtle hover:bg-paw-primary-soft text-paw-body rounded-paw-md text-sm font-medium transition-all border border-paw-border hover:border-paw-primary/30"
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
                    <label className="text-xs font-bold text-paw-muted uppercase tracking-wider">Display Name</label>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your display name"
                      className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-paw-muted uppercase tracking-wider">Bio</label>
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell others about yourself…" rows={3}
                      className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-paw-muted uppercase tracking-wider">City</label>
                    <input value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="e.g. Ghent"
                      className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-paw-primary hover:bg-paw-primary-hover disabled:opacity-50 text-white rounded-paw-md text-sm font-bold transition-all shadow-paw-action">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save
                    </button>
                    <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-5 py-2.5 bg-paw-panel-subtle hover:bg-paw-primary-soft text-paw-body rounded-paw-md text-sm font-medium transition-all border border-paw-border">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ── View Mode ── */
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h1 className="text-2xl font-extrabold text-paw-ink">{profile.display_name || profile.username}</h1>
                  <p className="text-sm text-paw-muted">@{profile.username}</p>
                  {profile.bio && <p className="text-sm text-paw-body mt-2 leading-relaxed">{profile.bio}</p>}

                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {profile.location_city && (
                      <span className="flex items-center gap-1 text-xs text-paw-muted bg-paw-panel-subtle px-3 py-1.5 rounded-full">
                        <MapPin className="w-3 h-3" /> {profile.location_city}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold ${trust.color}`}>
                      <Shield className="w-3 h-3" /> {trust.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-paw-primary bg-paw-primary-soft px-3 py-1.5 rounded-full font-semibold">
                      <PawPrint className="w-3 h-3" /> {profile.paw_points} Paw Points
                    </span>
                    <span className="flex items-center gap-1 text-xs text-paw-muted bg-paw-panel-subtle px-3 py-1.5 rounded-full">
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
            { icon: PawPrint, label: "Pets", value: pets.length, color: "text-paw-primary" },
            { icon: Award, label: "Trust Level", value: `${profile.trust_level}/5`, color: "text-paw-trust" },
            { icon: Star, label: "Paw Points", value: profile.paw_points, color: "text-paw-warning" },
          ].map(({ icon: Icon, label, value, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-paw-panel rounded-paw-lg shadow-sm border border-paw-border px-5 py-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              <p className="text-xl font-extrabold text-paw-ink">{value}</p>
              <p className="text-xs text-paw-muted font-medium">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Install App ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col gap-4 rounded-paw-lg border border-paw-border bg-paw-panel p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-paw-md bg-paw-primary-soft text-paw-primary">
                {isInstalled ? <CheckCircle className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-paw-ink">
                  {isInstalled ? "PawPal installed" : "Install PawPal"}
                </h2>
                <p className="text-sm text-paw-muted">
                  {installStatus ?? (isInstalled ? "Open it from your home screen any time." : "Add your profile, pets, and map to this device.")}
                </p>
              </div>
            </div>
            <button
              onClick={handleInstall}
              disabled={isInstalled}
              className="inline-flex items-center justify-center gap-2 rounded-paw-md bg-paw-primary px-5 py-2.5 text-sm font-bold text-white shadow-paw-action transition-all hover:bg-paw-primary-hover disabled:cursor-default disabled:bg-paw-panel-subtle disabled:text-paw-muted disabled:shadow-none"
            >
              {isInstalled ? <CheckCircle className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {isInstalled ? "Installed" : "Install"}
            </button>
          </div>
        </motion.div>

        {/* ── My Pets ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-paw-ink flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-paw-primary" /> My Pets
            </h2>
            <button
              onClick={() => setShowAddPet(!showAddPet)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-paw-md text-sm font-bold transition-all border shadow-sm ${
                showAddPet
                  ? "bg-paw-panel-subtle text-paw-body border-paw-border"
                  : "bg-paw-primary hover:bg-paw-primary-hover text-white border-paw-primary"
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
                <div className="bg-paw-panel rounded-paw-lg shadow-paw-panel border border-paw-border p-6 space-y-5">
                  {petError && (
                    <div className="flex items-center gap-2 rounded-paw-md border border-paw-danger/20 bg-paw-danger-soft px-4 py-3 text-sm font-medium text-paw-danger">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {petError}
                    </div>
                  )}

                  {/* Pet Name */}
                  <div>
                    <label className="text-xs font-bold text-paw-muted uppercase tracking-wider">Pet Name *</label>
                    <input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="e.g. Luna"
                      className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all" />
                  </div>

                  {/* Species */}
                  <div>
                    <label className="text-xs font-bold text-paw-muted uppercase tracking-wider">Species</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SPECIES_OPTIONS.map((s) => (
                        <button key={s.id} onClick={() => setPetSpecies(s.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                            petSpecies === s.id
                              ? "bg-paw-primary text-white border-paw-primary"
                              : "bg-paw-panel-subtle text-paw-body border-paw-border hover:border-paw-primary/40"
                          }`}>
                          <span>{s.emoji}</span> {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Breed + Blood Type row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-paw-muted uppercase tracking-wider">Breed</label>
                      <input value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="e.g. Golden Retriever"
                        className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-paw-muted uppercase tracking-wider">Blood Type</label>
                      <select value={petBloodType} onChange={(e) => setPetBloodType(e.target.value)}
                        className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all">
                        <option value="">Select...</option>
                        {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Owner Contact */}
                  <div>
                    <label className="text-xs font-bold text-paw-muted uppercase tracking-wider">Owner Contact (phone / email)</label>
                    <input value={petContact} onChange={(e) => setPetContact(e.target.value)} placeholder="e.g. +32 412 345 678"
                      className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all" />
                  </div>

                  {/* Social Tags */}
                  <div>
                    <label className="text-xs font-bold text-paw-muted uppercase tracking-wider">Personality Tags</label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {SOCIAL_PRESETS.map((tag) => (
                        <button key={tag} onClick={() => toggleTag(tag, petSocialTags, setPetSocialTags)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                            petSocialTags.includes(tag)
                              ? "bg-paw-trust text-white border-paw-trust"
                              : "bg-paw-trust-soft text-paw-trust border-paw-trust/15 hover:border-paw-trust/40"
                          }`}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Health Badges */}
                  <div>
                    <label className="text-xs font-bold text-paw-muted uppercase tracking-wider">Health &amp; Care</label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {HEALTH_PRESETS.map((tag) => (
                        <button key={tag} onClick={() => toggleTag(tag, petHealthBadges, setPetHealthBadges)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                            petHealthBadges.includes(tag)
                              ? "bg-paw-success text-white border-paw-success"
                              : "bg-paw-success-soft text-paw-success border-paw-success/15 hover:border-paw-success/40"
                          }`}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NFC Info Banner */}
                  <div className="bg-paw-trust-soft border border-paw-trust/15 rounded-paw-md px-4 py-3 flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-paw-trust shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-paw-trust">Want to write an NFC pet tag?</p>
                      <p className="text-xs text-paw-body mt-0.5">Open the PawPal app on your phone to write pet info to an NFC tag. The data syncs automatically!</p>
                    </div>
                  </div>

                  {/* Submit */}
                  <button onClick={handleAddPet} disabled={addingPet || !petName.trim()}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-paw-primary hover:bg-paw-primary-hover disabled:opacity-50 text-white rounded-paw-md text-sm font-bold transition-all shadow-paw-action">
                    {addingPet ? <Loader2 className="w-4 h-4 animate-spin" /> : <PawPrint className="w-4 h-4" />}
                    {addingPet ? "Saving..." : "Add Pet 🐾"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {pets.length === 0 ? (
            <div className="bg-paw-panel rounded-paw-lg shadow-sm border border-paw-border px-6 py-12 text-center">
              <PawPrint className="w-12 h-12 text-paw-primary/25 mx-auto mb-3" />
              <p className="text-paw-muted font-medium">No pets yet</p>
              <p className="text-xs text-paw-muted/70 mt-1">Click the + button above to add your first pet!</p>
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
                    className="bg-paw-panel rounded-paw-lg shadow-sm border border-paw-border overflow-hidden hover:shadow-paw-panel transition-shadow"
                  >
                    <div className="flex items-start gap-4 p-5">
                      {/* Pet avatar */}
                      <div className="w-14 h-14 rounded-paw-md bg-paw-primary-soft border border-paw-primary/15 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                        {pet.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                        ) : "🐾"}
                      </div>

                      {/* Pet info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-paw-ink">{pet.name}</h3>
                          {pet.nfc_tag_uid && (
                            <span className="flex items-center gap-0.5 text-[10px] bg-paw-success-soft text-paw-success px-2 py-0.5 rounded-full font-bold border border-paw-success/15">
                              <Nfc className="w-2.5 h-2.5" /> NFC
                            </span>
                          )}
                        </div>

                        {quirk && <p className="text-xs text-paw-muted italic mt-0.5">&ldquo;{quirk}&rdquo;</p>}

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {pet.breed && (
                            <span className="text-xs bg-paw-panel-subtle text-paw-body px-2 py-0.5 rounded-full">{pet.breed}</span>
                          )}
                          {computeAge(pet.birth_date) != null && (
                            <span className="text-xs bg-paw-panel-subtle text-paw-body px-2 py-0.5 rounded-full">
                              {computeAge(pet.birth_date)} yr{computeAge(pet.birth_date) !== 1 ? "s" : ""}
                            </span>
                          )}
                          {pet.blood_type && (
                            <span className="text-xs bg-paw-danger-soft text-paw-danger px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Droplets className="w-2.5 h-2.5" /> {pet.blood_type}
                            </span>
                          )}
                        </div>

                        {/* Health & Social badges */}
                        {(healthBadges.length > 0 || socialTags.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {healthBadges.map((b) => (
                              <span key={b} className="text-[10px] bg-paw-success-soft text-paw-success px-2 py-0.5 rounded-full border border-paw-success/15">{b}</span>
                            ))}
                            {socialTags.map((t) => (
                              <span key={t} className="text-[10px] bg-paw-trust-soft text-paw-trust px-2 py-0.5 rounded-full border border-paw-trust/15">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* View tag page */}
                      <a
                        href={`/tag/${pet.id}`}
                        target="_blank"
                        className="shrink-0 self-center text-paw-muted hover:text-paw-primary transition-colors"
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
