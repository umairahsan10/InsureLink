import { useState, useEffect } from "react";
import { claimsApi, type Claim } from "@/lib/api/claims";

interface UseFetchClaimsOptions {
  employeeId?: string;
  corporateId?: string;
  hospitalId?: string;
  insurerId?: string;
  status?: string;
  claimType?: string;
  page?: number;
  limit?: number;
}

interface UseFetchClaimsResult {
  claims: Claim[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  refetch: () => void;
}

export function useFetchClaims(
  options?: UseFetchClaimsOptions,
): UseFetchClaimsResult {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await claimsApi.getClaims({
          hospitalId: options?.hospitalId,
          insurerId: options?.insurerId,
          status: options?.status,
          claimType: options?.claimType,
          page: options?.page,
          limit: options?.limit,
        });

        setClaims(response.data || []);
        setMeta({
          total: response.meta?.total || 0,
          page: response.meta?.page || 1,
          totalPages: response.meta?.totalPages || 1,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch claims");
        setClaims([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [
    options?.hospitalId,
    options?.insurerId,
    options?.status,
    options?.claimType,
    options?.page,
    options?.limit,
    refreshKey,
  ]);

  return {
    claims,
    loading,
    error,
    total: meta.total,
    page: meta.page,
    totalPages: meta.totalPages,
    refetch,
  };
}
