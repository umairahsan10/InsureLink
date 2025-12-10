import { ClaimData, CLAIMS_STORAGE_KEY, loadStoredClaims, persistClaims } from "@/data/claimsData";
import { Claim } from "@/types/claims";

/**
 * CLAIMS SYNC SYSTEM DOCUMENTATION
 * 
 * Problem: Hardcoded claims in claims.json (hospital view) were not syncing 
 * with insurer's approval status updates stored in localStorage.
 * 
 * Solution: Sync hardcoded claims to insurer's localStorage and listen for updates
 * 
 * Data Flow:
 * 1. Hospital Page loads hardcoded claims from claims.json
 * 2. On mount, hospital page syncs hardcoded claims to insurer localStorage
 * 3. When insurer updates claim status, it calls persistClaims()
 * 4. persistClaims() dispatches CLAIMS_UPDATED_EVENT and updates localStorage
 * 5. Hospital page listeners detect the update and sync status back
 * 6. allClaimsData useMemo re-runs and picks up the updated status
 */

/**
 * Converts a hospital Claim to an insurer ClaimData format
 */
export const convertClaimToClaimData = (claim: Claim): ClaimData => {
  return {
    id: claim.id,
    patient: claim.employeeName,
    hospital: claim.hospitalName,
    date: claim.createdAt.split("T")[0],
    amount: claim.amountClaimed,
    priority: claim.priority || "Normal",
    status: claim.status as "Pending" | "Approved" | "Rejected",
    isPaid: claim.status === "Approved",
    treatmentCategory: claim.treatmentCategory,
    notes: `Employee: ${claim.employeeName}, Corporate: ${claim.corporateName}`,
  };
};

/**
 * Syncs hardcoded hospital claims to the insurer's localStorage
 * This ensures that when insurer updates claim status, it's reflected on hospital page
 * 
 * Called on hospital page mount to register all hardcoded claims with insurer
 */
export const syncHardcodedClaimsToInsurer = (hardcodedClaims: Claim[]) => {
  if (typeof window === "undefined") {
    return;
  }

  // Load existing insurer claims
  const existingClaims = loadStoredClaims();
  
  // Convert hardcoded hospital claims to insurer format
  const hardcodedAsClaimData = hardcodedClaims.map(convertClaimToClaimData);
  
  // Create a map of existing claims by ID for quick lookup
  const existingMap = new Map(existingClaims.map((c) => [c.id, c]));
  
  // Merge: for each hardcoded claim, update if exists, otherwise add
  // But preserve any status changes made on the insurer side
  const merged = existingClaims.map((existing) => {
    const hardcoded = hardcodedAsClaimData.find((h) => h.id === existing.id);
    if (hardcoded) {
      // Preserve the insurer's status changes, but update other fields
      return {
        ...hardcoded,
        status: existing.status, // Keep the insurer's approved/rejected status
        isPaid: existing.isPaid,
      };
    }
    return existing;
  });
  
  // Add any new hardcoded claims that don't exist in insurer's data
  for (const hardcoded of hardcodedAsClaimData) {
    if (!existingMap.has(hardcoded.id)) {
      merged.push(hardcoded);
    }
  }
  
  // Persist the merged claims back to insurer storage
  persistClaims(merged);
};

/**
 * Updates hospital claim with the latest status from insurer
 */
export const syncClaimStatusFromInsurer = (
  hospitalClaim: Claim,
  insurerClaims: ClaimData[]
): Claim => {
  const insurerClaim = insurerClaims.find((ic) => ic.id === hospitalClaim.id);
  
  if (insurerClaim && insurerClaim.status !== hospitalClaim.status) {
    return {
      ...hospitalClaim,
      status: insurerClaim.status as "Pending" | "Approved" | "Rejected",
      approvedAmount: insurerClaim.status === "Approved" ? hospitalClaim.amountClaimed : 0,
      updatedAt: new Date().toISOString(),
    };
  }
  
  return hospitalClaim;
};

/**
 * Syncs all hospital claims with current insurer status
 * Called from the hospital page's allClaimsData useMemo
 */
export const syncAllClaimsWithInsurer = (hospitalClaims: Claim[]): Claim[] => {
  const insurerClaims = loadStoredClaims();
  return hospitalClaims.map((claim) =>
    syncClaimStatusFromInsurer(claim, insurerClaims)
  );
};
