'use client';

import {
  getBenchmarkForClaim,
  calculateZScore,
  inferTreatmentCategory,
  calculateLengthOfStay,
  getTypicalStayRange,
  type HospitalTier,
} from './costBenchmarking';
import hospitalsData from '@/data/hospitals.json';

type TemplateKey = 'city-general' | 'karachi-care' | 'rehman-clinic';
export type DocumentTemplateKey = TemplateKey;

interface TemplateConfig {
  key: TemplateKey;
  label: string;
  keywords: string[];
  description: string;
}

export interface DocumentVerificationInput {
  file?: File | null;
  totalAmount?: number | null;
  lineItemsTotal?: number | null;
  admissionDate?: string | null;
  dischargeDate?: string | null;
  templateKey?: TemplateKey | '';
  documentSnippet?: string;
  treatmentCategory?: string | null;
  hospitalId?: string | null;
}

export interface DocumentVerificationResult {
  score: number;
  reasons: string[];
  sha256?: string;
  duplicateDetected: boolean;
  templateLabel?: string;
  metadataNote: string;
}

const TEMPLATE_CONFIG: TemplateConfig[] = [
  {
    key: 'city-general',
    label: 'City General Hospital',
    description: 'Official invoice with City General header and billing seal.',
    keywords: ['City General Hospital', 'Billing Department'],
  },
  {
    key: 'karachi-care',
    label: 'Karachi Care Medical Complex',
    description: 'Documents typically include Karachi Care crest and invoice footer.',
    keywords: ['Karachi Care', 'Medical Complex'],
  },
  {
    key: 'rehman-clinic',
    label: 'Rehman Clinic & Labs',
    description: 'Labs use “Rehman Clinic” watermark plus a lab reference number.',
    keywords: ['Rehman Clinic', 'Lab Ref'],
  },
];

const LOCAL_STORAGE_HASH_KEY = 'documentTrustHashes';
const LOCAL_STORAGE_SEEDED_KEY = 'documentTrustSeeded';

const getWindow = () => (typeof window !== 'undefined' ? window : undefined);

const readHashes = (): string[] => {
  const win = getWindow();
  if (!win) return [];
  try {
    const raw = win.localStorage.getItem(LOCAL_STORAGE_HASH_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const writeHashes = (hashes: string[]) => {
  const win = getWindow();
  if (!win) return;
  try {
    win.localStorage.setItem(LOCAL_STORAGE_HASH_KEY, JSON.stringify(hashes.slice(-25)));
  } catch {
    // ignore write failures
  }
};

export const ensureDemoHashSeeded = () => {
  const win = getWindow();
  if (!win) return;
  if (win.localStorage.getItem(LOCAL_STORAGE_SEEDED_KEY)) return;
  writeHashes([...readHashes(), 'DEMO_HASH_SAMPLE']);
  win.localStorage.setItem(LOCAL_STORAGE_SEEDED_KEY, 'true');
};

const bufferToHex = (buffer: ArrayBuffer) => {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const computeSha256 = async (file: File): Promise<string | undefined> => {
  const win = getWindow();
  if (!win?.crypto?.subtle) return undefined;
  const fileBuffer = await file.arrayBuffer();
  const hashBuffer = await win.crypto.subtle.digest('SHA-256', fileBuffer);
  return bufferToHex(hashBuffer);
};

const templateFromKey = (key?: TemplateKey | '') => TEMPLATE_CONFIG.find((template) => template.key === key);

const getHospitalIdFromTemplate = (templateKey: TemplateKey | ''): string | null => {
  if (!templateKey) return null;

  // Map template keys to hospital IDs
  // This is a direct mapping for the demo templates
  const templateToHospitalMap: Record<TemplateKey, string> = {
    'city-general': 'hosp-001', // City General Hospital
    'karachi-care': 'hosp-002', // National Hospital (closest match for demo)
    'rehman-clinic': 'hosp-004', // Services Hospital (closest match for demo)
  };

  return templateToHospitalMap[templateKey] || null;
};

const getHospitalTier = (hospitalId: string | null): HospitalTier | null => {
  if (!hospitalId) return null;
  const hospital = hospitalsData.find((h: any) => h.id === hospitalId);
  return (hospital?.tier as HospitalTier) || null;
};

export const markHashAsSuspicious = (hash?: string) => {
  if (!hash) return;
  const hashes = readHashes();
  if (!hashes.includes(hash)) {
    writeHashes([...hashes, hash]);
  }
};

export const getTemplateOptions = () => TEMPLATE_CONFIG;

export const verifyDocumentLocally = async (
  input: DocumentVerificationInput
): Promise<DocumentVerificationResult> => {
  let score = 100;
  const reasons: string[] = [];
  let sha256: string | undefined;
  let duplicateDetected = false;

  if (input.file) {
    try {
      sha256 = await computeSha256(input.file);
    } catch {
      reasons.push('Unable to compute SHA-256 hash for this document.');
      score -= 10;
    }
  } else {
    reasons.push('No document file selected.');
    score -= 20;
  }

  if (sha256) {
    const hashes = readHashes();
    if (hashes.includes(sha256)) {
      duplicateDetected = true;
      reasons.push('Duplicate detected: matches a previously uploaded document hash.');
      score -= 50;
      // Automatically mark duplicate as suspicious (no manual step needed)
      markHashAsSuspicious(sha256);
    } else {
      writeHashes([...hashes, sha256]);
    }
  }

  const totalAmount = Number(input.totalAmount ?? 0);
  const lineItemsTotal = Number(input.lineItemsTotal ?? 0);
  if (totalAmount > 0 && lineItemsTotal > 0) {
    if (Math.abs(totalAmount - lineItemsTotal) > 1) {
      reasons.push('Total amount does not match the sum of line items.');
      score -= 20;
    } else {
      score += 5;
    }
  } else {
    reasons.push('Total or line items amount missing for validation.');
    score -= 5;
  }

  if (input.admissionDate && input.dischargeDate) {
    const admission = new Date(input.admissionDate);
    const discharge = new Date(input.dischargeDate);
    if (discharge < admission) {
      reasons.push('Discharge date occurs before admission date.');
      score -= 15;
    } else {
      score += 5;
    }
  } else {
    reasons.push('Admission or discharge date missing.');
    score -= 5;
  }

  const template = templateFromKey(input.templateKey);
  if (template) {
    const snippet = input.documentSnippet?.toLowerCase() ?? '';
    if (!snippet) {
      reasons.push(`Template "${template.label}" selected but no text snippet provided for comparison.`);
      score -= 5;
    } else {
      const missingKeywords = template.keywords.filter((keyword) => !snippet.includes(keyword.toLowerCase()));
      if (missingKeywords.length) {
        reasons.push(`Template mismatch: missing keywords ${missingKeywords.join(', ')}.`);
        score -= 25;
      } else {
        score += 10;
      }
    }
  } else {
    reasons.push('No hospital template selected.');
    score -= 5;
  }

  // Cost Benchmarking Checks
  if (totalAmount > 0 && input.admissionDate && input.dischargeDate) {
    // Treatment category is now required, but we still infer for validation
    const treatmentCategory = input.treatmentCategory;
    const inferredCategory = inferTreatmentCategory(totalAmount);
    const hospitalId = input.hospitalId || getHospitalIdFromTemplate(input.templateKey || '');
    const hospitalTier = hospitalId ? getHospitalTier(hospitalId) : null;

    let benchmark = null;
    if (treatmentCategory) {
      benchmark = getBenchmarkForClaim(treatmentCategory, hospitalTier, hospitalId);

      if (benchmark) {
        // Amount comparison
        const ratio = totalAmount / benchmark.mean;
        if (ratio >= 3) {
          reasons.push(
            `Claim amount (Rs. ${totalAmount.toLocaleString()}) is ${ratio.toFixed(1)}× above average for ${treatmentCategory}${hospitalTier ? ` at ${hospitalTier} hospitals` : ''} (avg: Rs. ${benchmark.mean.toLocaleString()}).`
          );
          score -= 50;
        } else if (ratio >= 2) {
          reasons.push(
            `Claim amount (Rs. ${totalAmount.toLocaleString()}) is ${ratio.toFixed(1)}× above average for ${treatmentCategory}${hospitalTier ? ` at ${hospitalTier} hospitals` : ''} (avg: Rs. ${benchmark.mean.toLocaleString()}).`
          );
          score -= 30;
        }

        // Z-score calculation
        if (benchmark.stdDev > 0) {
          const zScore = calculateZScore(totalAmount, benchmark.mean, benchmark.stdDev);
          if (zScore > 3) {
            reasons.push(
              `Statistical outlier: Claim amount is ${zScore.toFixed(1)} standard deviations above mean (top 0.1% of claims).`
            );
            score -= 40;
          } else if (zScore > 2) {
            reasons.push(
              `Statistical outlier: Claim amount is ${zScore.toFixed(1)} standard deviations above mean (top 5% of claims).`
            );
            score -= 20;
          }
        }

        // Percentile check
        if (totalAmount > benchmark.percentile95) {
          reasons.push(
            `Claim amount exceeds 95th percentile (Rs. ${benchmark.percentile95.toLocaleString()}) for this category.`
          );
          score -= 15;
        }

        // Category mismatch check (validate user selection against inferred)
        if (treatmentCategory && inferredCategory && inferredCategory !== treatmentCategory) {
          reasons.push(
            `Category mismatch: Selected "${treatmentCategory}" but amount suggests "${inferredCategory}". Please verify the correct category.`
          );
          score -= 25;
        }
      }
    }

    // Length of stay check
    if (treatmentCategory) {
      const lengthOfStay = calculateLengthOfStay(input.admissionDate, input.dischargeDate);
      const typicalRange = getTypicalStayRange(treatmentCategory);
      if (lengthOfStay < typicalRange.min || lengthOfStay > typicalRange.max) {
        reasons.push(
          `Length of stay (${lengthOfStay} days) is outside typical range for ${treatmentCategory} (${typicalRange.min}-${typicalRange.max} days).`
        );
        score -= 15;
      }

      // Cost per day check
      const costPerDay = totalAmount / lengthOfStay;
      if (benchmark) {
        const avgCostPerDay = benchmark.mean / (typicalRange.min + typicalRange.max) / 2;
        if (costPerDay > avgCostPerDay * 2) {
          reasons.push(
            `Cost per day (Rs. ${costPerDay.toLocaleString()}) is unusually high for this treatment category.`
          );
          score -= 10;
        }
      }
    }
  }

  const metadataNote = 'Metadata check pending backend integration (simulated).';

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    reasons,
    sha256,
    duplicateDetected,
    templateLabel: template?.label,
    metadataNote,
  };
};

