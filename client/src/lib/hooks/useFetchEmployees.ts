import { useState, useEffect } from 'react';
import type { Employee } from '@/types/employee';

interface UseFetchEmployeesOptions {
  corporateId?: string;
  planId?: string;
}

export function useFetchEmployees(options?: UseFetchEmployeesOptions) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        
        if (options?.corporateId) {
          params.append('corporateId', options.corporateId);
        }
        
        if (options?.planId) {
          params.append('planId', options.planId);
        }

        const url = `/api/employees${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Failed to fetch employees');
        
        const data = await response.json();
        setEmployees(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [options?.corporateId, options?.planId]);

  return { employees, loading, error };
}

