"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/components/AuthProvider";
import { StatePanel } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { loadOrCreateOwnProfile } from "@/lib/profileViews";
import ProfileWorkspaceView, { type Pet, type PetSocialTraits, type Profile } from "@/app/profile/ProfileWorkspaceView";
import PushSubscriptionSettings from "@/app/profile/PushSubscriptionSettings";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";
import { loadP3B1g1AccountFixtures } from "@/lib/p3b1g1AccountFixtures";

const ACCOUNT_FIXTURES_ENABLED =
  process.env.NEXT_PUBLIC_P3B1G1_ACCOUNT_FIXTURES === "1";

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

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "");
    if (message) return message;
  }
  return fallback;
}

async function loadOrCreateProfile(user: User): Promise<Profile> {
  const profile = await loadOrCreateOwnProfile(supabase, {
    id: user.id,
    username: fallbackUsername(user),
    display_name: profileDisplayName(user),
  });
  return {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    language_pref: profile.language_pref,
    location_city: profile.location_city,
    trust_level: profile.trust_level,
    paw_points: profile.paw_points,
    is_verified: profile.is_verified,
    created_at: profile.created_at,
  };
}

export default function ProfilePage() {
  const { loader, t } = useRouteTranslations();
  const { user, session, loading: authLoading } = useAuth();
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
    if (!ACCOUNT_FIXTURES_ENABLED && !authLoading && !user) router.push("/auth");
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
      setInstallStatus(t("profileInstalledOnDevice"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [t]);

  useEffect(() => {
    if (ACCOUNT_FIXTURES_ENABLED) {
      let cancelled = false;
      queueMicrotask(() => {
        if (cancelled) return;
        const fixture = loadP3B1g1AccountFixtures().profile;
        setProfile(fixture.profile);
        setPets(fixture.pets);
        setEditName(fixture.profile.display_name || "");
        setEditBio(fixture.profile.bio || "");
        setEditCity(fixture.profile.location_city || "");
        setLoading(false);
      });
      return () => { cancelled = true; };
    }

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
        setProfileError(errorMessage(e, t("profileGenericError")));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, t]);

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
      setProfileError(errorMessage(error, t("profileGenericError")));
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
      setPetError(errorMessage(error, t("profileGenericError")));
    }
    setAddingPet(false);
  };

  const toggleTag = (tag: string, list: string[], setter: (value: string[]) => void) => {
    setter(list.includes(tag) ? list.filter((item) => item !== tag) : [...list, tag]);
  };

  const handleInstall = async () => {
    if (isInstalled) {
      setInstallStatus(t("profileAlreadyInstalled"));
      return;
    }

    if (!installPrompt) {
      setInstallStatus(t("profileInstallFromBrowserMenu"));
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallStatus(
      choice.outcome === "accepted"
        ? t("profileInstallingNow")
        : t("profileInstallDismissed")
    );
  };

  if ((!ACCOUNT_FIXTURES_ENABLED && authLoading) || loading) {
    return (
      <>
        {loader}
        <StatePanel state="loading" title={t("pwaLoadingLabel")} />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        {loader}
        <StatePanel
          state="error"
          title={t("profileUnavailableTitle")}
          body={profileError ?? t("profileUnavailableDescription")}
        />
      </>
    );
  }

  return (
    <>
      {loader}
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
      notificationSettings={<PushSubscriptionSettings accessToken={session?.access_token ?? null} t={t} />}
      t={t}
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
    </>
  );
}
