export type Coordinates = {
  lat: number;
  lng: number;
};

export type DistanceFormatOptions = {
  /** When true, include unit suffix (default: true). */
  withUnit?: boolean;
  /** Maximum number of fraction digits (default: 1 for km, 0 for m). */
  maximumFractionDigits?: number;
};

const EARTH_RADIUS_KM = 6371;

export const KARACHI_CENTER: Coordinates = {
  lat: 24.8607,
  lng: 67.0011,
};

export const CITY_CENTER_BY_NAME: Record<string, Coordinates> = {
  karachi: KARACHI_CENTER,
};

const toRadians = (value: number) => (value * Math.PI) / 180;

/**
 * Returns the great-circle distance between two coordinates in kilometers.
 * Falls back to 0 when inputs are incomplete.
 */
export function haversineDistance(
  origin?: Coordinates | null,
  destination?: Coordinates | null,
): number {
  if (!origin || !destination) {
    return 0;
  }

  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Formats a distance in kilometers into a friendly string.
 * - Under 1 km -> meters
 * - Otherwise -> kilometers with 1 decimal
 */
export function formatDistance(kilometers: number, options?: DistanceFormatOptions): string {
  const withUnit = options?.withUnit ?? true;

  if (kilometers <= 0) {
    return withUnit ? '0 m' : '0';
  }

  if (kilometers < 1) {
    const meters = Math.round(kilometers * 1000);
    return withUnit ? `${meters.toLocaleString()} m` : meters.toLocaleString();
  }

  const formatted = kilometers.toLocaleString(undefined, {
    maximumFractionDigits: options?.maximumFractionDigits ?? 1,
  });

  return withUnit ? `${formatted} km` : formatted;
}

export function getCityCenter(city?: string): Coordinates {
  if (!city) {
    return KARACHI_CENTER;
  }

  const key = city.trim().toLowerCase();
  return CITY_CENTER_BY_NAME[key] ?? KARACHI_CENTER;
}

export const DEFAULT_CITY_CENTER = KARACHI_CENTER;


