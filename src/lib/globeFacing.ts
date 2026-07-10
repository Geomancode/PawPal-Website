export const ENTER_DOT = 0.50;
export const EXIT_DOT = 0.42;

export type GlobeCoordinate = {
  lat: number;
  lng: number;
};

const DEG = Math.PI / 180;

function assertCoordinate(
  coordinate: GlobeCoordinate,
  label: "pin" | "pov",
) {
  if (
    !Number.isFinite(coordinate.lat) ||
    coordinate.lat < -90 ||
    coordinate.lat > 90
  ) {
    throw new RangeError(`${label}.lat must be a finite value from -90 to 90.`);
  }

  // Longitudes are periodic, so wrapped values such as -181deg are valid.
  if (!Number.isFinite(coordinate.lng)) {
    throw new RangeError(`${label}.lng must be a finite value.`);
  }
}

export function facingScore(
  pin: GlobeCoordinate,
  pov: GlobeCoordinate,
) {
  assertCoordinate(pin, "pin");
  assertCoordinate(pov, "pov");

  const pinLat = pin.lat * DEG;
  const povLat = pov.lat * DEG;
  const deltaLng = (pin.lng - pov.lng) * DEG;
  const score =
    Math.sin(pinLat) * Math.sin(povLat) +
    Math.cos(pinLat) * Math.cos(povLat) * Math.cos(deltaLng);

  return Math.max(-1, Math.min(1, score));
}

export function passesFacingHysteresis(score: number, wasVisible: boolean) {
  if (!Number.isFinite(score) || score < -1 || score > 1) {
    throw new RangeError("score must be a finite value from -1 to 1.");
  }

  return wasVisible ? score >= EXIT_DOT : score >= ENTER_DOT;
}

export function globeTangentVisibilityThreshold(altitude: number) {
  if (!Number.isFinite(altitude) || altitude < 0) {
    throw new RangeError("altitude must be a finite non-negative value.");
  }

  return 1 / (1 + altitude);
}
