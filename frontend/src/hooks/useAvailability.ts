import { useEffect, useState } from 'react';
import { availabilityService, type AvailabilityParams } from '../services/availabilityService';
import type { AvailabilityResponse } from '../types';

export function useAvailability(params: AvailabilityParams | null) {
  const [data, setData]     = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!params) { setData(null); return; }
    setLoading(true);
    setError(null);
    availabilityService
      .getSlots(params)
      .then((res) => setData(res.success ? res.data : null))
      .catch(() => setError('Failed to load available slots.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.facilityId, params?.date, params?.slotDurationMinutes, params?.instructorId]);

  return { data, loading, error };
}
