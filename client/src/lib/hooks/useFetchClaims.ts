import { useState, useEffect } from 'react';
import type { Claim } from '@/types/claims';

interface UseFetchClaimsOptions {
  employeeId?: string;
  corporateId?: string;
  hospitalId?: string;
  status?: string;
}

export function useFetchClaims(options?: UseFetchClaimsOptions) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        
        if (options?.employeeId) {
          params.append('employeeId', options.employeeId);
        }
        
        if (options?.corporateId) {
          params.append('corporateId', options.corporateId);
        }
        
        if (options?.hospitalId) {
          params.append('hospitalId', options.hospitalId);
        }
        
        if (options?.status) {
          params.append('status', options.status);
        }

        const url = `/api/claims${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Failed to fetch claims');
        
        const data = await response.json();
        setClaims(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [options?.employeeId, options?.corporateId, options?.hospitalId, options?.status]);

  return { claims, loading, error };
}

