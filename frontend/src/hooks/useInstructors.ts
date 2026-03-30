import { useCallback, useEffect, useState } from 'react';
import { instructorService } from '../services/instructorService';
import type { Instructor } from '../types';

export function useInstructors(_key?: number) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    instructorService
      .getAll()
      .then(data => { setInstructors(data); setError(null); })
      .catch(() => setError('Failed to load instructors.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load, _key]);

  return { instructors, loading, error, refresh: load };
}
