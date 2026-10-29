/** Whole calendar years from the canonical database date, using UTC throughout. */
export function getPetAgeYears(
  birthDate: string | null | undefined,
  now = new Date(),
): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;

  const birth = new Date(`${birthDate}T00:00:00Z`);
  if (
    !Number.isFinite(birth.getTime()) ||
    !Number.isFinite(now.getTime()) ||
    birth.toISOString().slice(0, 10) !== birthDate
  ) return null;

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())
  ) age -= 1;

  return age < 0 ? null : age;
}
