import { useCallback, useEffect, useState } from 'react';
import { bookingService } from '../services/bookingService';
import type { Booking } from '../types';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    bookingService
      .getAll()
      .then(setBookings)
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(refresh, [refresh]);

  return { bookings, loading, error, refresh };
}
