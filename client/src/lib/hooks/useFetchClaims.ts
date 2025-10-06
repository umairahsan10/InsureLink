import { useState, useEffect } from 'react';
import type { Claim } from '@/types/claims';

export function useFetchClaims(userId?: string) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        const response = await fetch('/api/claims');
        if (!response.ok) throw new Error('Failed to fetch claims');
        
        const data = await response.json();
        setClaims(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [userId]);

  return { claims, loading, error };
}

