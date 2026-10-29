"use client";

import { useI18n } from "@/i18n/I18nProvider";
import PetMediaImage from "@/components/PetMediaImage";

import type { ReactNode } from "react";
import PawIcon from "@/components/icons/PawIcon";
import { StatusMessage } from "@/components/ui";
import type { MessageKey } from "@/i18n/messages/en";

export type ProfileTranslation = (key: MessageKey) => string;

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
  notificationSettings?: ReactNode;
  t: ProfileTranslation;
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

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-paw-panel-subtle text-paw-muted",
  2: "bg-paw-trust-soft text-paw-on-trust-soft",
  3: "bg-paw-success-soft text-paw-on-success-soft",
  4: "bg-paw-primary-soft text-paw-on-primary-soft",
  5: "bg-paw-warning-soft text-paw-on-warning-soft",
};

const SPECIES_OPTIONS = [
  { id: "canine", emoji: "🐕" },
  { id: "feline", emoji: "🐈" },
  { id: "lagomorph", emoji: "🐰" },
  { id: "bird", emoji: "🦜" },
  { id: "reptile", emoji: "🦎" },
  { id: "fish", emoji: "🐠" },
  { id: "small_mammal", emoji: "🐹" },
  { id: "equine", emoji: "🐴" },
  { id: "other", emoji: "🐾" },
] as const;

const BLOOD_TYPES = ["Unknown", "DEA 1.1+", "DEA 1.1-", "DEA 1.2+", "DEA 3", "DEA 4", "DEA 5", "DEA 7", "Type A", "Type B", "Type AB"];
const SOCIAL_PRESETS = ["Friendly", "High Energy", "Slow to warm up", "Good with Kids", "Good with Dogs", "Not good with Cats", "Vocal", "Cuddly"];
const HEALTH_PRESETS = ["Fully Vaccinated", "Neutered", "Spayed", "Special Diet", "Allergies"];
const PROFILE_METRIC_CLASSES = {
  shellSpacing: "pt-[96px] pb-[64px]",
  ownerAvatarSize: "h-[80px] w-[80px]",
  fieldPaddingBlock: "py-[10px]",
  metadataIconSize: "h-paw-web-icon-compact w-paw-web-icon-compact",
  compactChipSpacing: "gap-paw-web-micro py-paw-web-micro",
  compactGap: "gap-paw-web-micro",
  petAvatarSize: "h-[56px] w-[56px]",
} as const;

function speciesLabel(id: string, t: ProfileTranslation) {
  switch (id) {
    case "canine": return t("profileSpeciesDog");
    case "feline": return t("profileSpeciesCat");
    case "lagomorph": return t("profileSpeciesRabbit");
    case "bird": return t("profileSpeciesBird");
    case "reptile": return t("profileSpeciesReptile");
    case "fish": return t("profileSpeciesFish");
    case "small_mammal": return t("profileSpeciesSmallMammal");
    case "equine": return t("profileSpeciesHorse");
    default: return t("profileSpeciesOther");
  }
}

function traitLabel(value: string, t: ProfileTranslation) {
  switch (value) {
    case "Friendly": return t("profileSocialFriendly");
    case "High Energy": return t("profileSocialHighEnergy");
    case "Slow to warm up": return t("profileSocialSlowToWarm");
    case "Good with Kids": return t("profileSocialGoodWithKids");
    case "Good with Dogs": return t("profileSocialGoodWithDogs");
    case "Not good with Cats": return t("profileSocialNotGoodWithCats");
    case "Vocal": return t("profileSocialVocal");
    case "Cuddly": return t("profileSocialCuddly");
    case "Fully Vaccinated": return t("profileHealthFullyVaccinated");
    case "Neutered": return t("profileHealthNeutered");
    case "Spayed": return t("profileHealthSpayed");
    case "Special Diet": return t("profileHealthSpecialDiet");
    case "Allergies": return t("profileHealthAllergies");
    default: return value;
  }
}

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
  notificationSettings,
  t,
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
  const { path } = useI18n();
  const trustColor = LEVEL_COLORS[profile.trust_level] || LEVEL_COLORS[1];
  const trustLabel =
    profile.trust_level === 2
      ? t("profileTrustFriendly")
      : profile.trust_level === 3
        ? t("profileTrustTrusted")
        : profile.trust_level === 4
          ? t("profileTrustVeteran")
          : profile.trust_level === 5
            ? t("profileTrustLegend")
            : t("profileTrustNewcomer");
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const displayName = profile.display_name || profile.username;
  const nfcReadyPets = pets.filter((pet) => Boolean(pet.nfc_tag_uid)).length;
  const contactReadyPets = pets.filter((pet) => Boolean(pet.owner_contact?.trim())).length;
  const readinessRows = [
    {
      label: t("profileReadinessPets"),
      value: pets.length,
      helper: pets.length === 0 ? t("profileReadinessPetsEmpty") : t("profileReadinessPetsReady"),
    },
    {
      label: t("profileReadinessNfcTags"),
      value: `${nfcReadyPets}/${pets.length || 0}`,
      helper: pets.length === 0 ? t("profileReadinessNfcEmpty") : t("profileReadinessNfcReady"),
    },
    {
      label: t("profileReadinessPublicContact"),
      value: `${contactReadyPets}/${pets.length || 0}`,
      helper: t("profileReadinessPublicContactHelper"),
    },
  ];

  return (
    <div className={`profile-page-shell ${showAddPet ? "profile-page-shell-add-mode" : ""} relative min-h-screen overflow-hidden bg-paw-page ${PROFILE_METRIC_CLASSES.shellSpacing}`}>
      <div className="mx-auto max-w-6xl px-paw-md sm:px-paw-xl lg:px-paw-xxl">
        {profileError && (
          <StatusMessage tone="critical" variant="compact" className="mb-paw-md">
            {profileError}
          </StatusMessage>
        )}

        <div className="profile-command-header mb-paw-xl">
          <div>
            <p className="text-paw-type-caption font-black uppercase tracking-[0.14em] text-paw-primary">{t("profileWorkspaceEyebrow")}</p>
            <h1 className="mt-paw-xs text-paw-type-h1 font-extrabold tracking-tight text-paw-ink sm:text-paw-type-display">
              {t("profileWorkspaceTitle")}
            </h1>
            <p className="mt-paw-xs max-w-2xl text-paw-type-body leading-6 text-paw-body">
              {t("profileWorkspaceDescription")}
            </p>
          </div>
          <div className="profile-command-chip">
            <PawIcon name="safety" className="h-paw-md w-paw-md" aria-hidden="true" />
            {t("profileTrustLevelPrefix")} {profile.trust_level}/5
          </div>
        </div>

        <div className="profile-workspace-grid mb-paw-xl">
          <section
            className="profile-hero-card profile-owner-card"
            aria-labelledby="profile-owner-heading"
          >
            <div className="profile-owner-topline">
              <div className={`profile-avatar ${PROFILE_METRIC_CLASSES.ownerAvatarSize} rounded-paw-lg bg-paw-panel border border-paw-border shadow-sm flex items-center justify-center overflow-hidden text-paw-type-h1`}>
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-paw-primary text-paw-type-h2 font-extrabold text-paw-on-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-paw-type-caption font-black uppercase tracking-[0.12em] text-paw-muted">{t("profileOwnerEyebrow")}</p>
                <h2 id="profile-owner-heading" className="mt-paw-xxs break-words text-paw-type-h2 font-extrabold text-paw-ink">
                  {displayName}
                </h2>
                <p className="break-all text-paw-type-body text-paw-muted">@{profile.username}</p>
              </div>
              {!editing && (
                <button
                  type="button"
                  onClick={onStartEditing}
                  className="profile-action-button profile-action-button-secondary"
                >
                  <PawIcon name="edit" className="h-paw-md w-paw-md" aria-hidden="true" />
                  {t("profileEditButton")}
                </button>
              )}
            </div>

            {editing ? (
              <div className="mt-paw-lg space-y-paw-md">
                  <div>
                    <label htmlFor="profile-edit-name" className="text-paw-type-caption font-bold text-paw-muted uppercase tracking-wider">{t("profileDisplayNameLabel")}</label>
                    <input id="profile-edit-name" value={editName} onChange={(e) => onEditNameChange(e.target.value)} placeholder={t("profileDisplayNamePlaceholder")}
                    className={`mt-paw-xxs w-full px-paw-md ${PROFILE_METRIC_CLASSES.fieldPaddingBlock} bg-paw-panel-subtle border border-paw-border rounded-paw-md text-paw-type-body text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all`} />
                  </div>
                  <div>
                    <label htmlFor="profile-edit-bio" className="text-paw-type-caption font-bold text-paw-muted uppercase tracking-wider">{t("profileBioLabel")}</label>
                    <textarea id="profile-edit-bio" value={editBio} onChange={(e) => onEditBioChange(e.target.value)} placeholder={t("profileBioPlaceholder")} rows={3}
                    className={`mt-paw-xxs w-full px-paw-md ${PROFILE_METRIC_CLASSES.fieldPaddingBlock} bg-paw-panel-subtle border border-paw-border rounded-paw-md text-paw-type-body text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all resize-none`} />
                  </div>
                  <div>
                    <label htmlFor="profile-edit-city" className="text-paw-type-caption font-bold text-paw-muted uppercase tracking-wider">{t("profileCityLabel")}</label>
                    <input id="profile-edit-city" value={editCity} onChange={(e) => onEditCityChange(e.target.value)} placeholder={t("profileCityPlaceholder")}
                    className={`mt-paw-xxs w-full px-paw-md ${PROFILE_METRIC_CLASSES.fieldPaddingBlock} bg-paw-panel-subtle border border-paw-border rounded-paw-md text-paw-type-body text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all`} />
                  </div>
                  <div className="flex flex-wrap gap-paw-xs pt-paw-xxs">
                    <button type="button" onClick={onSaveProfile} disabled={saving}
                      className="profile-action-button profile-action-button-primary">
                      {saving ? <PawIcon name="spinner" className="h-paw-md w-paw-md animate-spin" aria-hidden="true" /> : <PawIcon name="save" className="h-paw-md w-paw-md" aria-hidden="true" />}
                      {t("profileSaveButton")}
                    </button>
                    <button type="button" onClick={onCancelEditing} className="profile-action-button profile-action-button-secondary">
                      <PawIcon name="close" className="h-paw-md w-paw-md" aria-hidden="true" />
                      {t("profileCancelButton")}
                    </button>
                  </div>
              </div>
            ) : (
              <div className="mt-paw-lg">
                  {profile.bio ? (
                    <p className="break-words text-paw-type-body leading-6 text-paw-body">{profile.bio}</p>
                  ) : (
                    <p className="text-paw-type-body leading-6 text-paw-muted">{t("profileBioEmpty")}</p>
                  )}

                  <div className="profile-meta-grid mt-paw-lg">
                    <span className="profile-meta-chip">
                      <PawIcon name="location" className={PROFILE_METRIC_CLASSES.metadataIconSize} aria-hidden="true" />
                      <span className="break-words">{profile.location_city || t("profileCityNotListed")}</span>
                    </span>
                    <span className={`profile-meta-chip ${trustColor}`}>
                      <PawIcon name="safety" className={PROFILE_METRIC_CLASSES.metadataIconSize} aria-hidden="true" />
                      {trustLabel}
                    </span>
                    <span className="profile-meta-chip text-paw-primary bg-paw-primary-soft">
                      <PawIcon name="paw" className={PROFILE_METRIC_CLASSES.metadataIconSize} aria-hidden="true" />
                      {profile.paw_points} {t("profilePawPoints")}
                    </span>
                    <span className="profile-meta-chip">
                      <PawIcon name="calendar" className={PROFILE_METRIC_CLASSES.metadataIconSize} aria-hidden="true" />
                      {t("profileSincePrefix")} {memberSince}
                    </span>
                  </div>
              </div>
            )}
          </section>

          <aside
            className="profile-readiness-card"
            aria-labelledby="profile-readiness-heading"
          >
            <div className="flex items-start justify-between gap-paw-md">
              <div>
                <p className="text-paw-type-caption font-black uppercase tracking-[0.12em] text-paw-primary">{t("profileReadinessEyebrow")}</p>
                <h2 id="profile-readiness-heading" className="mt-paw-xxs text-paw-type-h2 font-extrabold text-paw-ink">{t("profileReadinessTitle")}</h2>
              </div>
              <div className="flex h-paw-min-tap w-paw-min-tap shrink-0 items-center justify-center rounded-paw-md bg-paw-trust-soft text-paw-on-trust-soft">
                <PawIcon name="health" className="h-paw-lg w-paw-lg" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-paw-lg space-y-paw-sm">
              {readinessRows.map((row) => (
                <div key={row.label} className="profile-readiness-row">
                  <div className="min-w-0">
                    <p className="text-paw-type-body font-extrabold text-paw-ink">{row.label}</p>
                    <p className="mt-0.5 text-paw-type-caption leading-5 text-paw-muted">{row.helper}</p>
                  </div>
                  <span className="profile-readiness-value">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="profile-install-compact mt-paw-md">
              <div className="flex items-start gap-paw-sm">
                <div className="flex h-paw-xxxl w-paw-xxxl shrink-0 items-center justify-center rounded-paw-md bg-paw-primary-soft text-paw-on-primary-soft">
                  {isInstalled ? <PawIcon name="confirm" className="h-paw-lg w-paw-lg" aria-hidden="true" /> : <PawIcon name="appLink" className="h-paw-lg w-paw-lg" aria-hidden="true" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-paw-type-body font-extrabold text-paw-ink">{isInstalled ? t("profilePawPalInstalled") : t("profileInstallPawPal")}</p>
                  <p className="mt-0.5 text-paw-type-caption leading-5 text-paw-muted">
                    {installStatus ?? (isInstalled ? t("profileInstalledHelper") : t("profileInstallHelper"))}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onInstall}
                disabled={isInstalled}
                className="profile-action-button profile-action-button-primary w-full"
              >
                {isInstalled ? <PawIcon name="confirm" className="h-paw-md w-paw-md" aria-hidden="true" /> : <PawIcon name="download" className="h-paw-md w-paw-md" aria-hidden="true" />}
                {isInstalled ? t("profileInstalledButton") : t("profileInstallButton")}
              </button>
            </div>

            <button
              type="button"
              onClick={() => onSetShowAddPet(true)}
              className="profile-action-button profile-action-button-secondary mt-paw-md w-full"
              aria-expanded={showAddPet}
            >
              <PawIcon name="add" className="h-paw-md w-paw-md" aria-hidden="true" />
              {pets.length === 0 ? t("profileAddFirstPet") : t("profileAddAnotherPet")}
            </button>
          </aside>
        </div>

        {notificationSettings}

        <section
          aria-labelledby="profile-pets-heading"
        >
          <div className="profile-section-heading mb-paw-md">
            <div>
              <p className="text-paw-type-caption font-black uppercase tracking-[0.12em] text-paw-primary">{t("profilePetRecordsEyebrow")}</p>
              <h2 id="profile-pets-heading" className="mt-paw-xxs text-paw-type-h2 font-extrabold text-paw-ink flex items-center gap-paw-xs">
                <PawIcon name="paw" className="h-paw-lg w-paw-lg text-paw-primary" aria-hidden="true" />
                {t("profileMyPetsTitle")}
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
              {showAddPet ? <PawIcon name="close" className="h-paw-md w-paw-md" aria-hidden="true" /> : <PawIcon name="add" className="h-paw-md w-paw-md" aria-hidden="true" />}
              {showAddPet ? t("profileCancelButton") : t("profileAddPetButton")}
            </button>
          </div>

          {showAddPet && (
            <div className="overflow-hidden mb-paw-md">
                <div className="profile-form-card bg-paw-panel rounded-paw-lg shadow-paw-panel border border-paw-border p-paw-xl space-y-paw-lg">
                  {petError && (
                    <StatusMessage tone="critical" variant="compact" role="alert">
                      {petError}
                    </StatusMessage>
                  )}

                  <div>
                    <label htmlFor="profile-pet-name" className="text-paw-type-caption font-bold text-paw-muted uppercase tracking-wider">{t("profilePetNameRequiredLabel")}</label>
                    <input id="profile-pet-name" value={petName} onChange={(e) => onPetNameChange(e.target.value)} placeholder={t("profilePetNamePlaceholder")}
                  className={`mt-paw-xxs w-full px-paw-md ${PROFILE_METRIC_CLASSES.fieldPaddingBlock} bg-paw-panel-subtle border border-paw-border rounded-paw-md text-paw-type-body text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all`} />
                  </div>

                  <fieldset>
                    <legend className="text-paw-type-caption font-bold text-paw-muted uppercase tracking-wider">{t("profileSpeciesLabel")}</legend>
                    <div className="flex flex-wrap gap-paw-xs mt-paw-xs">
                      {SPECIES_OPTIONS.map((s) => (
                        <button key={s.id} type="button" onClick={() => onPetSpeciesChange(s.id)}
                          aria-pressed={petSpecies === s.id}
                          className={`flex items-center ${PROFILE_METRIC_CLASSES.compactChipSpacing} px-paw-sm rounded-paw-sm text-paw-type-caption font-medium transition-all border ${
                            petSpecies === s.id
                              ? "bg-paw-primary text-paw-accent-ink border-paw-primary"
                              : "bg-paw-panel-subtle text-paw-body border-paw-border hover:border-paw-primary/40"
                          }`}>
                          <span aria-hidden="true">{s.emoji}</span> {speciesLabel(s.id, t)}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="grid gap-paw-md sm:grid-cols-2">
                    <div>
                      <label htmlFor="profile-pet-breed" className="text-paw-type-caption font-bold text-paw-muted uppercase tracking-wider">{t("profileBreedLabel")}</label>
                      <input id="profile-pet-breed" value={petBreed} onChange={(e) => onPetBreedChange(e.target.value)} placeholder={t("profileBreedPlaceholder")}
                  className={`mt-paw-xxs w-full px-paw-md ${PROFILE_METRIC_CLASSES.fieldPaddingBlock} bg-paw-panel-subtle border border-paw-border rounded-paw-md text-paw-type-body text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all`} />
                    </div>
                    <div>
                      <label htmlFor="profile-pet-blood-type" className="text-paw-type-caption font-bold text-paw-muted uppercase tracking-wider">{t("profileBloodTypeLabel")}</label>
                      <select id="profile-pet-blood-type" value={petBloodType} onChange={(e) => onPetBloodTypeChange(e.target.value)}
                  className={`mt-paw-xxs w-full px-paw-md ${PROFILE_METRIC_CLASSES.fieldPaddingBlock} bg-paw-panel-subtle border border-paw-border rounded-paw-md text-paw-type-body text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all`}>
                        <option value="">{t("profileSelectPlaceholder")}</option>
                        {BLOOD_TYPES.map((bloodType) => <option key={bloodType} value={bloodType}>{bloodType === "Unknown" ? t("profileBloodUnknown") : bloodType}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-pet-contact" className="text-paw-type-caption font-bold text-paw-muted uppercase tracking-wider">{t("profileOwnerContactLabel")}</label>
                    <input id="profile-pet-contact" value={petContact} onChange={(e) => onPetContactChange(e.target.value)} placeholder={t("profileOwnerContactPlaceholder")}
                  className={`mt-paw-xxs w-full px-paw-md ${PROFILE_METRIC_CLASSES.fieldPaddingBlock} bg-paw-panel-subtle border border-paw-border rounded-paw-md text-paw-type-body text-paw-ink outline-none focus:border-paw-trust focus:ring-4 focus:ring-paw-trust/15 transition-all`} />
                  </div>

                  <fieldset>
                    <legend className="text-paw-type-caption font-bold text-paw-muted uppercase tracking-wider">{t("profilePersonalityTagsLabel")}</legend>
                    <div className={`flex flex-wrap ${PROFILE_METRIC_CLASSES.compactGap} mt-paw-xs`}>
                      {SOCIAL_PRESETS.map((tag) => (
                        <button key={tag} type="button" onClick={() => onToggleSocialTag(tag)}
                          aria-pressed={petSocialTags.includes(tag)}
                          className={`px-paw-sm py-paw-xxs rounded-paw-sm text-paw-type-caption font-medium transition-all border ${
                            petSocialTags.includes(tag)
                              ? "bg-paw-trust text-paw-accent-ink border-paw-trust"
                              : "bg-paw-trust-soft text-paw-on-trust-soft border-paw-trust/15 hover:border-paw-trust/40"
                          }`}>
                          {traitLabel(tag, t)}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="text-paw-type-caption font-bold text-paw-muted uppercase tracking-wider">{t("profileHealthCareLabel")}</legend>
                    <div className={`flex flex-wrap ${PROFILE_METRIC_CLASSES.compactGap} mt-paw-xs`}>
                      {HEALTH_PRESETS.map((tag) => (
                        <button key={tag} type="button" onClick={() => onToggleHealthBadge(tag)}
                          aria-pressed={petHealthBadges.includes(tag)}
                          className={`px-paw-sm py-paw-xxs rounded-paw-sm text-paw-type-caption font-medium transition-all border ${
                            petHealthBadges.includes(tag)
                              ? "bg-paw-success text-paw-accent-ink border-paw-success"
                              : "bg-paw-success-soft text-paw-on-success-soft border-paw-success/15 hover:border-paw-success/40"
                          }`}>
                          {traitLabel(tag, t)}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="bg-paw-trust-soft border border-paw-trust/15 rounded-paw-md px-paw-md py-paw-sm flex items-start gap-paw-sm">
                    <PawIcon name="appLink" className="w-paw-lg h-paw-lg text-paw-trust shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-paw-type-caption font-bold text-paw-trust">{t("profileNfcWriteTitle")}</p>
                      <p className="text-paw-type-caption text-paw-body mt-0.5">{t("profileNfcWriteDescription")}</p>
                    </div>
                  </div>

                  <button type="button" onClick={onAddPet} disabled={addingPet || !petName.trim()}
                    className="profile-action-button profile-action-button-primary w-full">
                    {addingPet ? <PawIcon name="spinner" className="w-paw-md h-paw-md animate-spin" aria-hidden="true" /> : <PawIcon name="paw" className="w-paw-md h-paw-md" aria-hidden="true" />}
                    {addingPet ? t("profileSaving") : t("profileAddPetButton")}
                  </button>
                </div>
            </div>
          )}

          {pets.length === 0 ? (
            <div className="profile-empty-card">
              <PawIcon name="paw" className="w-paw-xxxl h-paw-xxxl text-paw-primary mx-auto mb-paw-sm" aria-hidden="true" />
              <h3 className="text-paw-type-h3 font-extrabold text-paw-ink">{t("profileEmptyPetsTitle")}</h3>
              <p className="mx-auto mt-paw-xs max-w-md text-paw-type-body leading-6 text-paw-muted">
                {t("profileEmptyPetsDescription")}
              </p>
              <button
                type="button"
                onClick={() => onSetShowAddPet(true)}
                className="profile-action-button profile-action-button-primary mx-auto mt-paw-lg"
                aria-expanded={showAddPet}
              >
                <PawIcon name="add" className="h-paw-md w-paw-md" aria-hidden="true" />
                {t("profileAddFirstPet")}
              </button>
            </div>
          ) : (
            <div className="space-y-paw-sm">
              {pets.map((pet) => {
                const healthBadges: string[] = pet.social_traits?.health_badges ?? [];
                const socialTags: string[] = pet.social_traits?.social_tags ?? [];
                const quirk: string | undefined = pet.social_traits?.quirk;
                const petAge = computeAge(pet.birth_date);

                return (
                  <article
                    key={pet.id}
                    className="profile-pet-card"
                  >
                    <div className="flex items-start gap-paw-md">
                      <div className={`relative ${PROFILE_METRIC_CLASSES.petAvatarSize} rounded-paw-md bg-paw-primary-soft border border-paw-primary/15 flex items-center justify-center text-paw-type-h2 shrink-0 overflow-hidden`}>
                        {pet.avatar_url ? (
                          <PetMediaImage src={pet.avatar_url} alt={pet.name} fill sizes="56px" unoptimized className="w-full h-full object-cover" />
                        ) : <PawIcon name="paw" className="h-paw-xl w-paw-xl text-paw-primary" aria-hidden="true" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-paw-xs">
                          <h3 className="break-words text-paw-type-body font-bold text-paw-ink">{pet.name}</h3>
                          {pet.nfc_tag_uid ? (
                            <span className="profile-pet-status profile-pet-status-ready">
                              <PawIcon name="nfc" className="w-paw-sm h-paw-sm" aria-hidden="true" /> {t("profileNfcReady")}
                            </span>
                          ) : (
                            <span className="profile-pet-status">
                              <PawIcon name="nfc" className="w-paw-sm h-paw-sm" aria-hidden="true" /> {t("profileNoNfc")}
                            </span>
                          )}
                          {pet.owner_contact ? (
                            <span className="profile-pet-status profile-pet-status-contact">{t("profileContactSaved")}</span>
                          ) : (
                            <span className="profile-pet-status">{t("profileContactMissing")}</span>
                          )}
                        </div>

                        {quirk && <p className="text-paw-type-caption text-paw-muted italic mt-paw-xxs break-words">&ldquo;{quirk}&rdquo;</p>}

                        <div className="flex flex-wrap items-center gap-paw-xs mt-paw-sm">
                          <span className="profile-pet-fact">{pet.breed || t("profileBreedNotListed")}</span>
                          <span className="profile-pet-fact">
                            {petAge != null
                              ? `${petAge} ${petAge === 1 ? t("profileYearSingular") : t("profileYearPlural")}`
                              : t("profileAgeNotListed")}
                          </span>
                          <span className="profile-pet-fact profile-pet-fact-care">
                            <PawIcon name="humidity" className="w-paw-sm h-paw-sm" aria-hidden="true" />
                            {pet.blood_type || t("profileBloodNotListed")}
                          </span>
                        </div>

                        {(healthBadges.length > 0 || socialTags.length > 0) ? (
                          <div className={`flex flex-wrap ${PROFILE_METRIC_CLASSES.compactGap} mt-paw-sm`}>
                            {healthBadges.map((badge) => (
                              <span key={badge} className="profile-tag profile-tag-care">{traitLabel(badge, t)}</span>
                            ))}
                            {socialTags.map((tag) => (
                              <span key={tag} className="profile-tag profile-tag-social">{traitLabel(tag, t)}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-paw-sm text-paw-type-caption text-paw-muted">{t("profileNoTraitsListed")}</p>
                        )}
                      </div>

                      <a
                        href={path(`/tag/${pet.id}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-tag-link"
                        aria-label={`${t("profileViewPublicTagForPrefix")} ${pet.name}`}
                        title={t("profileViewPublicTagTitle")}
                      >
                        <PawIcon name="externalLink" className="w-paw-md h-paw-md" aria-hidden="true" />
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
