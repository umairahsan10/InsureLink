export type ClaimPriority = 'High' | 'Medium' | 'Normal' | 'Low';
export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected' | 'Under Review';

export interface ClaimData {
  id: string;
  patient: string;
  hospital: string;
  date: string;
  amount: string;
  priority: ClaimPriority;
  status: ClaimStatus;
  isPaid?: boolean;
}

export const CLAIMS_STORAGE_KEY = 'insurerClaimsData';
export const CLAIMS_UPDATED_EVENT = 'claims-data-updated';
export const CLAIMS_DATA_VERSION = 3;

export const defaultClaimData: ClaimData[] = [
  { id: 'CLM-8921', patient: 'Ahmed Khan', hospital: 'City General Hospital', date: '2025-10-06', amount: 'Rs. 1,250', priority: 'High', status: 'Pending', isPaid: false },
  { id: 'CLM-8920', patient: 'Sara Ali', hospital: 'National Hospital', date: '2025-10-06', amount: 'Rs. 450', priority: 'Normal', status: 'Pending', isPaid: false },
  { id: 'CLM-8919', patient: 'Hamza Malik', hospital: 'Aga Khan University Hospital', date: '2025-10-05', amount: 'Rs. 5,200', priority: 'High', status: 'Pending', isPaid: false },
  { id: 'CLM-8918', patient: 'Ayesha Siddiqui', hospital: 'Services Hospital', date: '2025-10-05', amount: 'Rs. 820', priority: 'Normal', status: 'Approved', isPaid: true },
  { id: 'CLM-8917', patient: 'Bilal Ahmed', hospital: 'Jinnah Hospital', date: '2025-10-04', amount: 'Rs. 3,100', priority: 'Normal', status: 'Rejected', isPaid: false }
];

interface StoredClaimsPayload {
  version: number;
  claims: ClaimData[];
}

const parseClaimsPayload = (raw: string | null): StoredClaimsPayload | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        version: 0,
        claims: parsed
      };
    }

    if (parsed && Array.isArray(parsed.claims)) {
      return {
        version: typeof parsed.version === 'number' ? parsed.version : 0,
        claims: parsed.claims as ClaimData[]
      };
    }
  } catch {
    return null;
  }

  return null;
};

export const loadStoredClaims = (): ClaimData[] => {
  if (typeof window === 'undefined') {
    return defaultClaimData;
  }

  const stored = window.localStorage.getItem(CLAIMS_STORAGE_KEY);
  const payload = parseClaimsPayload(stored);

  if (!payload || payload.version !== CLAIMS_DATA_VERSION) {
    persistClaims(defaultClaimData);
    return defaultClaimData;
  }

  return payload.claims;
};

export const persistClaims = (claims: ClaimData[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: StoredClaimsPayload = {
    version: CLAIMS_DATA_VERSION,
    claims
  };

  window.localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(
    new CustomEvent<ClaimData[]>(CLAIMS_UPDATED_EVENT, {
      detail: claims
    })
  );
};

