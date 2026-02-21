import { Hospital } from '@prisma/client';

/**
 * Converts Prisma Decimal types to plain numbers for latitude and longitude
 * This ensures consistent JSON serialization across all API responses
 */
export function serializeHospital<T extends Partial<Hospital>>(hospital: T): T {
  if (!hospital) return hospital;

  return {
    ...hospital,
    ...(hospital.latitude !== null &&
      hospital.latitude !== undefined && {
        latitude: convertDecimalToNumber(hospital.latitude),
      }),
    ...(hospital.longitude !== null &&
      hospital.longitude !== undefined && {
        longitude: convertDecimalToNumber(hospital.longitude),
      }),
  };
}

/**
 * Serializes an array of hospitals
 */
export function serializeHospitals<T extends Partial<Hospital>>(
  hospitals: T[],
): T[] {
  return hospitals.map(serializeHospital);
}

/**
 * Converts a Prisma Decimal to a plain JavaScript number
 */
function convertDecimalToNumber(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  // If it's already a number, return it
  if (typeof value === 'number') {
    return value;
  }

  // If it's a Decimal object from Prisma (has shape {s, e, d})
  if (
    value &&
    typeof value === 'object' &&
    's' in value &&
    'e' in value &&
    'd' in value
  ) {
    return Number(value);
  }

  // If it's a string, parse it
  if (typeof value === 'string') {
    return parseFloat(value);
  }

  return Number(value);
}
