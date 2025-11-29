'use client';

import claimsData from '@/data/claims.json';
import hospitalsData from '@/data/hospitals.json';

export type TreatmentCategory =
  | 'Surgery'
  | 'Emergency Care'
  | 'Routine Checkup'
  | 'Lab Test'
  | 'Maternity'
  | 'Cardiology'
  | 'Orthopedics'
  | 'General Consultation';

export type HospitalTier = 'Tier-1' | 'Tier-2' | 'Tier-3';

// Type guard to check if a string is a valid HospitalTier
export function isHospitalTier(tier: string): tier is HospitalTier {
  return ['Tier-1', 'Tier-2', 'Tier-3'].includes(tier);
}

interface Claim {
  id: string;
  amountClaimed: number;
  treatmentCategory?: string;
  hospitalId: string;
  admissionDate: string;
  dischargeDate: string;
}

interface ClaimWithCorporate extends Claim {
  corporateId?: string;
}


interface BenchmarkStats {
  mean: number;
  stdDev: number;
  count: number;
  percentile75: number;
  percentile90: number;
  percentile95: number;
  min: number;
  max: number;
}

interface BenchmarkData {
  [key: string]: BenchmarkStats;
}

const CACHE_KEY = 'costBenchmarkCache';
const CACHE_VERSION = '1.0';

let cachedBenchmarks: BenchmarkData | null = null;

const getWindow = () => (typeof window !== 'undefined' ? window : undefined);

const calculateStats = (amounts: number[]): BenchmarkStats | null => {
  if (amounts.length === 0) return null;

  const sorted = [...amounts].sort((a, b) => a - b);
  const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  const variance =
    amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  const percentile = (arr: number[], p: number) => {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, Math.min(index, arr.length - 1))];
  };

  return {
    mean,
    stdDev,
    count: amounts.length,
    percentile75: percentile(sorted, 75),
    percentile90: percentile(sorted, 90),
    percentile95: percentile(sorted, 95),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
};

const loadBenchmarks = (): BenchmarkData => {
  const win = getWindow();
  if (win) {
    try {
      const cached = win.localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.version === CACHE_VERSION && parsed.data) {
          return parsed.data;
        }
      }
    } catch {
      // Ignore cache errors
    }
  }

  const benchmarks: BenchmarkData = {};

  // Build hospital tier map
  const hospitalTierMap: Record<string, HospitalTier> = {};
  hospitalsData.forEach((hosp: { id: string; tier?: string }) => {
    if (hosp.tier && isHospitalTier(hosp.tier)) {
      hospitalTierMap[hosp.id] = hosp.tier;
    }
  });

  // Group claims by different dimensions
  const byTreatmentAndTier: Record<string, number[]> = {};
  const byTreatment: Record<string, number[]> = {};
  const byHospital: Record<string, number[]> = {};
  const byCorporate: Record<string, number[]> = {};

  claimsData.forEach((claim: Claim) => {
    const amount = claim.amountClaimed;
    const treatment = claim.treatmentCategory;
    const hospitalId = claim.hospitalId;
    const tier = hospitalTierMap[hospitalId];
    const corporateId = (claim as ClaimWithCorporate).corporateId;

    // Treatment + Tier (primary)
    if (treatment && tier) {
      const key = `${treatment}|${tier}`;
      if (!byTreatmentAndTier[key]) byTreatmentAndTier[key] = [];
      byTreatmentAndTier[key].push(amount);
    }

    // Treatment only (fallback)
    if (treatment) {
      if (!byTreatment[treatment]) byTreatment[treatment] = [];
      byTreatment[treatment].push(amount);
    }

    // Hospital only (tertiary)
    if (hospitalId) {
      if (!byHospital[hospitalId]) byHospital[hospitalId] = [];
      byHospital[hospitalId].push(amount);
    }

    // Corporate (optional)
    if (corporateId) {
      if (!byCorporate[corporateId]) byCorporate[corporateId] = [];
      byCorporate[corporateId].push(amount);
    }
  });

  // Calculate stats for each dimension
  Object.entries(byTreatmentAndTier).forEach(([key, amounts]) => {
    const stats = calculateStats(amounts);
    if (stats && stats.count >= 3) {
      benchmarks[`treatmentTier:${key}`] = stats;
    }
  });

  Object.entries(byTreatment).forEach(([treatment, amounts]) => {
    const stats = calculateStats(amounts);
    if (stats) {
      benchmarks[`treatment:${treatment}`] = stats;
    }
  });

  Object.entries(byHospital).forEach(([hospitalId, amounts]) => {
    const stats = calculateStats(amounts);
    if (stats) {
      benchmarks[`hospital:${hospitalId}`] = stats;
    }
  });

  Object.entries(byCorporate).forEach(([corporateId, amounts]) => {
    const stats = calculateStats(amounts);
    if (stats) {
      benchmarks[`corporate:${corporateId}`] = stats;
    }
  });

  // Cache results
  if (win) {
    try {
      win.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ version: CACHE_VERSION, data: benchmarks })
      );
    } catch {
      // Ignore cache errors
    }
  }

  return benchmarks;
};

export const getBenchmarks = (): BenchmarkData => {
  if (!cachedBenchmarks) {
    cachedBenchmarks = loadBenchmarks();
  }
  return cachedBenchmarks;
};

export const getBenchmarkForClaim = (
  treatmentCategory: string | null | undefined,
  hospitalTier: HospitalTier | null | undefined,
  hospitalId: string | null | undefined
): BenchmarkStats | null => {
  const benchmarks = getBenchmarks();

  // Try treatment + tier (primary, require 3+ claims)
  if (treatmentCategory && hospitalTier) {
    const key = `treatmentTier:${treatmentCategory}|${hospitalTier}`;
    const stats = benchmarks[key];
    if (stats && stats.count >= 3) {
      return stats;
    }
  }

  // Fallback to treatment only
  if (treatmentCategory) {
    const key = `treatment:${treatmentCategory}`;
    const stats = benchmarks[key];
    if (stats) {
      return stats;
    }
  }

  // Fallback to hospital only
  if (hospitalId) {
    const key = `hospital:${hospitalId}`;
    const stats = benchmarks[key];
    if (stats) {
      return stats;
    }
  }

  return null;
};

export const calculateZScore = (amount: number, mean: number, stdDev: number): number => {
  if (stdDev === 0) return 0;
  return (amount - mean) / stdDev;
};

export const inferTreatmentCategory = (amount: number): TreatmentCategory | null => {
  if (amount > 100000) {
    return 'Surgery';
  } else if (amount >= 50000 && amount <= 100000) {
    return 'Cardiology';
  } else if (amount >= 10000 && amount < 50000) {
    return 'Routine Checkup';
  } else if (amount < 10000) {
    return 'Lab Test';
  }
  return null;
};

export const calculateLengthOfStay = (admissionDate: string, dischargeDate: string): number => {
  const admission = new Date(admissionDate);
  const discharge = new Date(dischargeDate);
  const diffTime = Math.abs(discharge.getTime() - admission.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1; // Minimum 1 day
};

export const getTypicalStayRange = (treatmentCategory: string): { min: number; max: number } => {
  // Typical stay ranges by treatment category
  const ranges: Record<string, { min: number; max: number }> = {
    Surgery: { min: 1, max: 7 },
    'Emergency Care': { min: 1, max: 3 },
    'Routine Checkup': { min: 1, max: 2 },
    'Lab Test': { min: 1, max: 1 },
    Maternity: { min: 2, max: 5 },
    Cardiology: { min: 2, max: 5 },
    Orthopedics: { min: 1, max: 5 },
    'General Consultation': { min: 1, max: 2 },
  };

  return ranges[treatmentCategory] || { min: 1, max: 3 };
};

