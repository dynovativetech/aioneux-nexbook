import { useState } from 'react';
import { Calendar, Clock, Building2, User } from 'lucide-react';
import { useAuth }     from '../../context/AuthContext';
import { useBookings } from '../../hooks/useBookings';
import { bookingService } from '../../services/bookingService';
import Badge, { bookingStatusColor } from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import type { Booking, BookingStatus } from '../../types';

type Filter = 'All' | BookingStatus;
const FILTERS: Filter[] = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MyBookingsPage() {
  const { user }                   = useAuth();
  const { bookings, loading, refresh } = useBookings();
  const [filter, setFilter]        = useState<Filter>('All');
  const [cancelling, setCancelling] = useState<number | null>(null);

  const mine = bookings.filter((b) => b.userId === user?.id);
  const shown = filter === 'All' ? mine : mine.filter((b) => b.status === filter);

  async function cancel(id: number) {
    setCancelling(id);
    try {
      await bookingService.cancel(id);
      refresh();
    } catch {
      alert('Failed to cancel booking.');
    } finally {
      setCancelling(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filter === f
                ? 'bg-[#0078D7] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] py-16 text-center text-gray-400">
          <Calendar size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bookings found</p>
          <p className="text-sm mt-1">Try a different filter or create a new booking.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((b: Booking) => (
            <div key={b.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Left info */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge label={b.status} color={bookingStatusColor(b.status)} />
                  <span className="text-xs text-gray-400">#{b.id}</span>
                </div>

                <h3 className="font-semibold text-gray-800">{b.facilityName}</h3>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={12} /> {b.activityName}
                  </span>
                  {b.instructorName && (
                    <span className="flex items-center gap-1.5">
                      <User size={12} /> {b.instructorName}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 col-span-2">
                    <Calendar size={12} /> {fmt(b.startTime)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {new Date(b.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {(b.status === 'Pending' || b.status === 'Confirmed') && (
                <Button variant="danger" size="sm"
                  loading={cancelling === b.id}
                  onClick={() => cancel(b.id)}>
                  Cancel
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

