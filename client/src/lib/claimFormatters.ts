import type { Claim } from "@/lib/api/claims";

/**
 * Safely convert a Prisma Decimal (returned as string over JSON) to a JS number.
 * Handles string, number, Decimal-like objects, null, and undefined.
 */
export function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  if (typeof val === "object" && typeof (val as { toString?: unknown }).toString === "function") {
    return parseFloat(String(val)) || 0;
  }
  return 0;
}

/** Extract a display-ready patient name from a claim's hospital visit. */
export function getPatientName(claim: Claim): string {
  if (claim.hospitalVisit?.dependent) {
    const d = claim.hospitalVisit.dependent;
    return `${d.firstName} ${d.lastName}`;
  }
  if (claim.hospitalVisit?.employee?.user) {
    const u = claim.hospitalVisit.employee.user;
    return `${u.firstName} ${u.lastName}`;
  }
  return "Unknown";
}

/** Extract the hospital display name from a claim. */
export function getHospitalName(claim: Claim): string {
  return claim.hospitalVisit?.hospital?.hospitalName || "Unknown";
}
