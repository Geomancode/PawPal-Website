"use client";

import {
  MapPin, Shield, PawPrint, Edit3, Save,
  X, Plus, Calendar, Droplets, Nfc, Loader2, Smartphone,
  AlertCircle, Download, CheckCircle, ExternalLink, HeartPulse,
} from "lucide-react";

export interface Profile {
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

export interface PetSocialTraits {
  social_tags?: string[];
  health_badges?: string[];
  quirk?: string;
  achievements?: string[];
  [key: string]: unknown;
}

export interface Pet {
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

type ProfileWorkspaceViewProps = {
  profile: Profile;
  pets: Pet[];
  profileError: string | null;
  editing: boolean;
  saving: boolean;
  showAddPet: boolean;
  addingPet: boolean;
  petError: string | null;
  installStatus: string | null;
  isInstalled: boolean;
  editName: string;
  editBio: string;
  editCity: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petBloodType: string;
  petContact: string;
  petSocialTags: string[];
  petHealthBadges: string[];
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveProfile: () => void;
  onInstall: () => void;
  onSetShowAddPet: (value: boolean) => void;
  onAddPet: () => void;
  onEditNameChange: (value: string) => void;
  onEditBioChange: (value: string) => void;
  onEditCityChange: (value: string) => void;
  onPetNameChange: (value: string) => void;
  onPetSpeciesChange: (value: string) => void;
  onPetBreedChange: (value: string) => void;
  onPetBloodTypeChange: (value: string) => void;
  onPetContactChange: (value: string) => void;
  onToggleSocialTag: (tag: string) => void;
  onToggleHealthBadge: (tag: string) => void;
};

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

function computeAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

export default function ProfileWorkspaceView({
  profile,
  pets,
  profileError,
  editing,
  saving,
  showAddPet,
  addingPet,
  petError,
  installStatus,
  isInstalled,
  editName,
  editBio,
  editCity,
  petName,
  petSpecies,
  petBreed,
  petBloodType,
  petContact,
  petSocialTags,
  petHealthBadges,
  onStartEditing,
  onCancelEditing,
  onSaveProfile,
  onInstall,
  onSetShowAddPet,
  onAddPet,
  onEditNameChange,
  onEditBioChange,
  onEditCityChange,
  onPetNameChange,
  onPetSpeciesChange,
  onPetBreedChange,
  onPetBloodTypeChange,
  onPetContactChange,
  onToggleSocialTag,
  onToggleHealthBadge,
}: ProfileWorkspaceViewProps) {
  const trust = TRUST_LABELS[profile.trust_level] || TRUST_LABELS[1];
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const displayName = profile.display_name || profile.username;
  const nfcReadyPets = pets.filter((pet) => Boolean(pet.nfc_tag_uid)).length;
  const contactReadyPets = pets.filter((pet) => Boolean(pet.owner_contact?.trim())).length;
  const readinessRows = [
    {
      label: "Pets",
      value: pets.length,
      helper: pets.length === 0 ? "Add a pet profile to start." : "Profiles connected to this owner account.",
    },
    {
      label: "NFC tags",
      value: `${nfcReadyPets}/${pets.length || 0}`,
      helper: pets.length === 0 ? "Tags appear after a pet is added." : "Pets with a linked public finder page.",
    },
    {
      label: "Public contact",
      value: `${contactReadyPets}/${pets.length || 0}`,
      helper: "Pets with owner contact saved for finder pages.",
    },
  ];

  return (
    <div className={`profile-page-shell ${showAddPet ? "profile-page-shell-add-mode" : ""} relative min-h-screen overflow-hidden bg-paw-page pt-24 pb-16`}>
      <div className="mx-auto max-w-6xl px-4">
        {profileError && (
          <div className="mb-4 flex items-center gap-2 rounded-paw-md border border-paw-danger/20 bg-paw-danger-soft px-4 py-3 text-sm font-medium text-paw-danger">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {profileError}
          </div>
        )}

        <div className="profile-command-header mb-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-paw-primary">Account workspace</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-paw-ink sm:text-4xl">
              Profile readiness
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-paw-body">
              Manage owner details, pet safety profiles, install status, and NFC-ready finder information from one account surface.
            </p>
          </div>
          <div className="profile-command-chip">
            <Shield className="h-4 w-4" aria-hidden="true" />
            Trust level {profile.trust_level}/5
          </div>
        </div>

        <div className="profile-workspace-grid mb-6">
          <section
            className="profile-hero-card profile-owner-card"
            aria-labelledby="profile-owner-heading"
          >
            <div className="profile-owner-topline">
              <div className="profile-avatar h-20 w-20 rounded-paw-lg bg-paw-panel border border-paw-border shadow-sm flex items-center justify-center overflow-hidden text-3xl">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-paw-primary text-2xl font-extrabold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-paw-muted">Owner profile</p>
                <h2 id="profile-owner-heading" className="mt-1 break-words text-2xl font-extrabold text-paw-ink">
                  {displayName}
                </h2>
                <p className="break-all text-sm text-paw-muted">@{profile.username}</p>
              </div>
              {!editing && (
                <button
                  type="button"
                  onClick={onStartEditing}
                  className="profile-action-button profile-action-button-secondary"
                >
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                  Edit Profile
                </button>
              )}
            </div>

            {editing ? (
              <div className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="profile-edit-name" className="text-xs font-bold text-paw-muted uppercase tracking-wider">Display Name</label>
                    <input id="profile-edit-name" value={editName} onChange={(e) => onEditNameChange(e.target.value)} placeholder="Your display name"
                      className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all" />
                  </div>
                  <div>
                    <label htmlFor="profile-edit-bio" className="text-xs font-bold text-paw-muted uppercase tracking-wider">Bio</label>
                    <textarea id="profile-edit-bio" value={editBio} onChange={(e) => onEditBioChange(e.target.value)} placeholder="Tell others about yourself…" rows={3}
                      className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all resize-none" />
                  </div>
                  <div>
                    <label htmlFor="profile-edit-city" className="text-xs font-bold text-paw-muted uppercase tracking-wider">City</label>
                    <input id="profile-edit-city" value={editCity} onChange={(e) => onEditCityChange(e.target.value)} placeholder="e.g. Ghent"
                      className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all" />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" onClick={onSaveProfile} disabled={saving}
                      className="profile-action-button profile-action-button-primary">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                      Save
                    </button>
                    <button type="button" onClick={onCancelEditing} className="profile-action-button profile-action-button-secondary">
                      <X className="h-4 w-4" aria-hidden="true" />
                      Cancel
                    </button>
                  </div>
              </div>
            ) : (
              <div className="mt-5">
                  {profile.bio ? (
                    <p className="break-words text-sm leading-6 text-paw-body">{profile.bio}</p>
                  ) : (
                    <p className="text-sm leading-6 text-paw-muted">Add a short owner note so trusted community members know who manages these pet profiles.</p>
                  )}

                  <div className="profile-meta-grid mt-5">
                    <span className="profile-meta-chip">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="break-words">{profile.location_city || "City not listed"}</span>
                    </span>
                    <span className={`profile-meta-chip ${trust.color}`}>
                      <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                      {trust.label}
                    </span>
                    <span className="profile-meta-chip text-paw-primary bg-paw-primary-soft">
                      <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
                      {profile.paw_points} Paw Points
                    </span>
                    <span className="profile-meta-chip">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      Since {memberSince}
                    </span>
                  </div>
              </div>
            )}
          </section>

          <aside
            className="profile-readiness-card"
            aria-labelledby="profile-readiness-heading"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-paw-primary">Readiness</p>
                <h2 id="profile-readiness-heading" className="mt-1 text-xl font-extrabold text-paw-ink">Pet safety status</h2>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-paw-md bg-paw-trust-soft text-paw-trust">
                <HeartPulse className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {readinessRows.map((row) => (
                <div key={row.label} className="profile-readiness-row">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-paw-ink">{row.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-paw-muted">{row.helper}</p>
                  </div>
                  <span className="profile-readiness-value">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="profile-install-compact mt-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-paw-md bg-paw-primary-soft text-paw-primary">
                  {isInstalled ? <CheckCircle className="h-5 w-5" aria-hidden="true" /> : <Smartphone className="h-5 w-5" aria-hidden="true" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-paw-ink">{isInstalled ? "PawPal installed" : "Install PawPal"}</p>
                  <p className="mt-0.5 text-xs leading-5 text-paw-muted">
                    {installStatus ?? (isInstalled ? "Open it from your home screen any time." : "Add profile, pets, and map access to this device.")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onInstall}
                disabled={isInstalled}
                className="profile-action-button profile-action-button-primary w-full"
              >
                {isInstalled ? <CheckCircle className="h-4 w-4" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                {isInstalled ? "Installed" : "Install"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => onSetShowAddPet(true)}
              className="profile-action-button profile-action-button-secondary mt-4 w-full"
              aria-expanded={showAddPet}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {pets.length === 0 ? "Add first pet" : "Add another pet"}
            </button>
          </aside>
        </div>

        <section
          aria-labelledby="profile-pets-heading"
        >
          <div className="profile-section-heading mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-paw-primary">Pet records</p>
              <h2 id="profile-pets-heading" className="mt-1 text-xl font-extrabold text-paw-ink flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-paw-primary" aria-hidden="true" />
                My Pets
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onSetShowAddPet(!showAddPet)}
              className={`profile-action-button ${
                showAddPet ? "profile-action-button-secondary" : "profile-action-button-primary"
              }`}
              aria-expanded={showAddPet}
            >
              {showAddPet ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
              {showAddPet ? "Cancel" : "Add Pet"}
            </button>
          </div>

          {showAddPet && (
            <div className="overflow-hidden mb-4">
                <div className="profile-form-card bg-paw-panel rounded-paw-lg shadow-paw-panel border border-paw-border p-6 space-y-5">
                  {petError && (
                    <div className="flex items-center gap-2 rounded-paw-md border border-paw-danger/20 bg-paw-danger-soft px-4 py-3 text-sm font-medium text-paw-danger" role="alert">
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {petError}
                    </div>
                  )}

                  <div>
                    <label htmlFor="profile-pet-name" className="text-xs font-bold text-paw-muted uppercase tracking-wider">Pet Name *</label>
                    <input id="profile-pet-name" value={petName} onChange={(e) => onPetNameChange(e.target.value)} placeholder="e.g. Luna"
                      className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all" />
                  </div>

                  <fieldset>
                    <legend className="text-xs font-bold text-paw-muted uppercase tracking-wider">Species</legend>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SPECIES_OPTIONS.map((s) => (
                        <button key={s.id} type="button" onClick={() => onPetSpeciesChange(s.id)}
                          aria-pressed={petSpecies === s.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-paw-sm text-xs font-medium transition-all border ${
                            petSpecies === s.id
                              ? "bg-paw-primary text-white border-paw-primary"
                              : "bg-paw-panel-subtle text-paw-body border-paw-border hover:border-paw-primary/40"
                          }`}>
                          <span aria-hidden="true">{s.emoji}</span> {s.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="profile-pet-breed" className="text-xs font-bold text-paw-muted uppercase tracking-wider">Breed</label>
                      <input id="profile-pet-breed" value={petBreed} onChange={(e) => onPetBreedChange(e.target.value)} placeholder="e.g. Golden Retriever"
                        className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all" />
                    </div>
                    <div>
                      <label htmlFor="profile-pet-blood-type" className="text-xs font-bold text-paw-muted uppercase tracking-wider">Blood Type</label>
                      <select id="profile-pet-blood-type" value={petBloodType} onChange={(e) => onPetBloodTypeChange(e.target.value)}
                        className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all">
                        <option value="">Select...</option>
                        {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-pet-contact" className="text-xs font-bold text-paw-muted uppercase tracking-wider">Owner Contact (phone / email)</label>
                    <input id="profile-pet-contact" value={petContact} onChange={(e) => onPetContactChange(e.target.value)} placeholder="e.g. +32 412 345 678"
                      className="mt-1 w-full px-4 py-2.5 bg-paw-panel-subtle border border-paw-border rounded-paw-md text-sm text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all" />
                  </div>

                  <fieldset>
                    <legend className="text-xs font-bold text-paw-muted uppercase tracking-wider">Personality Tags</legend>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {SOCIAL_PRESETS.map((tag) => (
                        <button key={tag} type="button" onClick={() => onToggleSocialTag(tag)}
                          aria-pressed={petSocialTags.includes(tag)}
                          className={`px-3 py-1 rounded-paw-sm text-xs font-medium transition-all border ${
                            petSocialTags.includes(tag)
                              ? "bg-paw-trust text-white border-paw-trust"
                              : "bg-paw-trust-soft text-paw-trust border-paw-trust/15 hover:border-paw-trust/40"
                          }`}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="text-xs font-bold text-paw-muted uppercase tracking-wider">Health &amp; Care</legend>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {HEALTH_PRESETS.map((tag) => (
                        <button key={tag} type="button" onClick={() => onToggleHealthBadge(tag)}
                          aria-pressed={petHealthBadges.includes(tag)}
                          className={`px-3 py-1 rounded-paw-sm text-xs font-medium transition-all border ${
                            petHealthBadges.includes(tag)
                              ? "bg-paw-success text-white border-paw-success"
                              : "bg-paw-success-soft text-paw-success border-paw-success/15 hover:border-paw-success/40"
                          }`}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="bg-paw-trust-soft border border-paw-trust/15 rounded-paw-md px-4 py-3 flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-paw-trust shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-bold text-paw-trust">Want to write an NFC pet tag?</p>
                      <p className="text-xs text-paw-body mt-0.5">Open the PawPal app on your phone to write pet info to an NFC tag. The data syncs automatically.</p>
                    </div>
                  </div>

                  <button type="button" onClick={onAddPet} disabled={addingPet || !petName.trim()}
                    className="profile-action-button profile-action-button-primary w-full">
                    {addingPet ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <PawPrint className="w-4 h-4" aria-hidden="true" />}
                    {addingPet ? "Saving..." : "Add Pet"}
                  </button>
                </div>
            </div>
          )}

          {pets.length === 0 ? (
            <div className="profile-empty-card">
              <PawPrint className="w-10 h-10 text-paw-primary mx-auto mb-3" aria-hidden="true" />
              <h3 className="text-lg font-extrabold text-paw-ink">Add your first pet profile</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-paw-muted">
                Pet records power finder pages, NFC readiness, and safer community context.
              </p>
              <button
                type="button"
                onClick={() => onSetShowAddPet(true)}
                className="profile-action-button profile-action-button-primary mx-auto mt-5"
                aria-expanded={showAddPet}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add first pet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pets.map((pet) => {
                const healthBadges: string[] = pet.social_traits?.health_badges ?? [];
                const socialTags: string[] = pet.social_traits?.social_tags ?? [];
                const quirk: string | undefined = pet.social_traits?.quirk;

                return (
                  <article
                    key={pet.id}
                    className="profile-pet-card"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-paw-md bg-paw-primary-soft border border-paw-primary/15 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                        {pet.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                        ) : <PawPrint className="h-6 w-6 text-paw-primary" aria-hidden="true" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-base font-bold text-paw-ink">{pet.name}</h3>
                          {pet.nfc_tag_uid ? (
                            <span className="profile-pet-status profile-pet-status-ready">
                              <Nfc className="w-3 h-3" aria-hidden="true" /> NFC ready
                            </span>
                          ) : (
                            <span className="profile-pet-status">
                              <Nfc className="w-3 h-3" aria-hidden="true" /> No NFC
                            </span>
                          )}
                          {pet.owner_contact ? (
                            <span className="profile-pet-status profile-pet-status-contact">Contact saved</span>
                          ) : (
                            <span className="profile-pet-status">Contact missing</span>
                          )}
                        </div>

                        {quirk && <p className="text-xs text-paw-muted italic mt-1 break-words">&ldquo;{quirk}&rdquo;</p>}

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="profile-pet-fact">{pet.breed || "Breed not listed"}</span>
                          <span className="profile-pet-fact">
                            {computeAge(pet.birth_date) != null
                              ? `${computeAge(pet.birth_date)} yr${computeAge(pet.birth_date) !== 1 ? "s" : ""}`
                              : "Age not listed"}
                          </span>
                          <span className="profile-pet-fact profile-pet-fact-care">
                            <Droplets className="w-3 h-3" aria-hidden="true" />
                            {pet.blood_type || "Blood not listed"}
                          </span>
                        </div>

                        {(healthBadges.length > 0 || socialTags.length > 0) ? (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {healthBadges.map((b) => (
                              <span key={b} className="profile-tag profile-tag-care">{b}</span>
                            ))}
                            {socialTags.map((t) => (
                              <span key={t} className="profile-tag profile-tag-social">{t}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-paw-muted">No health or personality notes listed yet.</p>
                        )}
                      </div>

                      <a
                        href={`/tag/${pet.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-tag-link"
                        aria-label={`View public tag page for ${pet.name}`}
                        title="View public tag page"
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
