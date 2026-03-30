import { useCallback, useEffect, useState } from 'react';
import { facilityService } from '../services/facilityService';
import type { Facility } from '../types';

export function useFacilities(_key?: number) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]    = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    facilityService
      .getAll()
      .then(data => { setFacilities(data); setError(null); })
      .catch(() => setError('Failed to load facilities.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load, _key]);

  return { facilities, loading, error, refresh: load };
}
