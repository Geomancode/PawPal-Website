"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import ProfileWorkspaceView, { type Pet, type PetSocialTraits, type Profile } from "./ProfileWorkspaceView";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

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

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCity, setEditCity] = useState("");

  const [showAddPet, setShowAddPet] = useState(false);
  const [addingPet, setAddingPet] = useState(false);
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("canine");
  const [petBreed, setPetBreed] = useState("");
  const [petBloodType, setPetBloodType] = useState("");
  const [petContact, setPetContact] = useState("");
  const [petSocialTags, setPetSocialTags] = useState<string[]>([]);
  const [petHealthBadges, setPetHealthBadges] = useState<string[]>([]);

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
      setPetName("");
      setPetBreed("");
      setPetBloodType("");
      setPetContact("");
      setPetSocialTags([]);
      setPetHealthBadges([]);
      setPetSpecies("canine");
      setShowAddPet(false);
    } else if (error) {
      setPetError(errorMessage(error));
    }
    setAddingPet(false);
  };

  const toggleTag = (tag: string, list: string[], setter: (value: string[]) => void) => {
    setter(list.includes(tag) ? list.filter((item) => item !== tag) : [...list, tag]);
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

  return (
    <ProfileWorkspaceView
      profile={profile}
      pets={pets}
      profileError={profileError}
      editing={editing}
      saving={saving}
      showAddPet={showAddPet}
      addingPet={addingPet}
      petError={petError}
      installStatus={installStatus}
      isInstalled={isInstalled}
      editName={editName}
      editBio={editBio}
      editCity={editCity}
      petName={petName}
      petSpecies={petSpecies}
      petBreed={petBreed}
      petBloodType={petBloodType}
      petContact={petContact}
      petSocialTags={petSocialTags}
      petHealthBadges={petHealthBadges}
      onStartEditing={() => setEditing(true)}
      onCancelEditing={() => setEditing(false)}
      onSaveProfile={handleSave}
      onInstall={handleInstall}
      onSetShowAddPet={setShowAddPet}
      onAddPet={handleAddPet}
      onEditNameChange={setEditName}
      onEditBioChange={setEditBio}
      onEditCityChange={setEditCity}
      onPetNameChange={setPetName}
      onPetSpeciesChange={setPetSpecies}
      onPetBreedChange={setPetBreed}
      onPetBloodTypeChange={setPetBloodType}
      onPetContactChange={setPetContact}
      onToggleSocialTag={(tag) => toggleTag(tag, petSocialTags, setPetSocialTags)}
      onToggleHealthBadge={(tag) => toggleTag(tag, petHealthBadges, setPetHealthBadges)}
    />
  );
}
