import { useCallback, useEffect, useState } from 'react';
import { activityService } from '../services/activityService';
import type { Activity } from '../types';

export function useActivities(_key?: number) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    activityService
      .getAll()
      .then(data => { setActivities(data); setError(null); })
      .catch(() => setError('Failed to load activities.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load, _key]);

  return { activities, loading, error, refresh: load };
}
