export type ClaimPriority = "High" | "Medium" | "Normal" | "Low";
export type ClaimStatus = "Pending" | "Approved" | "Rejected";

export interface ClaimData {
  id: string;
  patient: string;
  hospital: string;
  date: string;
  amount: number;
  priority: ClaimPriority;
  status: ClaimStatus;
  isPaid?: boolean;
}

export const CLAIMS_STORAGE_KEY = "insurerClaimsData";
export const CLAIMS_UPDATED_EVENT = "claims-data-updated";
export const CLAIMS_DATA_VERSION = 4;

export const defaultClaimData: ClaimData[] = [
  {
    id: "CLM-2025-0001",
    patient: "Ali Raza",
    hospital: "City General Hospital",
    date: "2025-09-30",
    amount: 125000,
    priority: "Normal",
    status: "Pending",
    isPaid: false,
  },
  {
    id: "CLM-2025-0002",
    patient: "Sara Khan",
    hospital: "Eastside Medical Center",
    date: "2025-10-01",
    amount: 18000,
    priority: "Normal",
    status: "Pending",
    isPaid: false,
  },
  {
    id: "CLM-2025-0003",
    patient: "Bilal Khan",
    hospital: "Crescent Clinic",
    date: "2025-09-22",
    amount: 42000,
    priority: "Normal",
    status: "Pending",
    isPaid: false,
  },
  {
    id: "CLM-2025-0004",
    patient: "Fahad Ahmed",
    hospital: "NorthCare Hospital",
    date: "2025-09-26",
    amount: 32000,
    priority: "Normal",
    status: "Pending",
    isPaid: false,
  },
  {
    id: "CLM-2025-0005",
    patient: "Sana Rafi",
    hospital: "Lakeside Hospital",
    date: "2025-09-15",
    amount: 90000,
    priority: "High",
    status: "Pending",
    isPaid: false,
  },
  {
    id: "CLM-2025-0006",
    patient: "Nadia Farooq",
    hospital: "Crescent Clinic",
    date: "2025-09-05",
    amount: 15000,
    priority: "Normal",
    status: "Approved",
    isPaid: true,
  },
  {
    id: "CLM-2025-0007",
    patient: "Omar Malik",
    hospital: "Eastside Medical Center",
    date: "2025-08-20",
    amount: 8000,
    priority: "Normal",
    status: "Rejected",
    isPaid: false,
  },
  {
    id: "CLM-2025-0008",
    patient: "Imran Qureshi",
    hospital: "City General Hospital",
    date: "2025-08-30",
    amount: 22000,
    priority: "Normal",
    status: "Approved",
    isPaid: true,
  },
  {
    id: "CLM-2025-0009",
    patient: "Amna Iqbal",
    hospital: "Crescent Clinic",
    date: "2025-09-07",
    amount: 6000,
    priority: "Normal",
    status: "Approved",
    isPaid: true,
  },
  {
    id: "CLM-2025-0010",
    patient: "Zara Khan",
    hospital: "Eastside Medical Center",
    date: "2025-10-02",
    amount: 4500,
    priority: "Normal",
    status: "Pending",
    isPaid: false,
  },
  {
    id: "CLM-2025-0011",
    patient: "Ayesha Mir",
    hospital: "Lakeside Hospital",
    date: "2025-09-19",
    amount: 27500,
    priority: "Normal",
    status: "Pending",
    isPaid: false,
  },
  {
    id: "CLM-2025-0012",
    patient: "Zubair Ahmed",
    hospital: "City General Hospital",
    date: "2025-10-04",
    amount: 6500,
    priority: "Normal",
    status: "Pending",
    isPaid: false,
  },
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
        claims: parsed,
      };
    }

    if (parsed && Array.isArray(parsed.claims)) {
      return {
        version: typeof parsed.version === "number" ? parsed.version : 0,
        claims: parsed.claims as ClaimData[],
      };
    }
  } catch {
    return null;
  }

  return null;
};

export const loadStoredClaims = (): ClaimData[] => {
  if (typeof window === "undefined") {
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
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredClaimsPayload = {
    version: CLAIMS_DATA_VERSION,
    claims,
  };

  window.localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(
    new CustomEvent<ClaimData[]>(CLAIMS_UPDATED_EVENT, {
      detail: claims,
    })
  );
};
