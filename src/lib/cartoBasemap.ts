/** Browser key: restrict each environment to its own hosts in CARTO. */
export function getCartoRasterTileUrl(): string | null {
  // Keep this static access so Next.js includes the correct build-time value.
  const key = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();
  if (!key) return null;

  return `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=${encodeURIComponent(key)}`;
}
