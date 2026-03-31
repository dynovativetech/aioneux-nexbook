import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Building2, Clock,
  CheckCircle2, AlertCircle, XCircle, CalendarDays,
} from 'lucide-react';
import { venueService, type VenueListItem } from '../../services/venueService';
import { facilityService } from '../../services/facilityService';
import type { Booking, Facility } from '../../types';
import Badge, { bookingStatusColor } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toLocalDateStr(d: Date) {
  return d.toLocaleDateString('en-CA'); // yyyy-MM-dd in local time
}

function fmtDateHeader(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function isToday(d: Date) {
  return toLocalDateStr(d) === toLocalDateStr(new Date());
}

// â”€â”€ Timeline bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const OPEN_HOUR  = 6;
const CLOSE_HOUR = 23;
const TOTAL_MINS = (CLOSE_HOUR - OPEN_HOUR) * 60;

function timeToMinutes(iso: string) {
  try {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes() - OPEN_HOUR * 60;
  } catch { return 0; }
}

function BookingBar({ booking }: { booking: Booking }) {
  const start = Math.max(0, timeToMinutes(booking.startTime));
  const end   = Math.min(TOTAL_MINS, timeToMinutes(booking.endTime));
  const leftPct  = (start / TOTAL_MINS) * 100;
  const widthPct = Math.max(1, ((end - start) / TOTAL_MINS) * 100);

  const colorMap: Record<string, string> = {
    Confirmed:  'bg-[#0087e0] hover:bg-[#0078D7]',
    Pending:    'bg-amber-400 hover:bg-amber-500',
    Cancelled:  'bg-gray-300',
    Completed:  'bg-emerald-500',
  };

  return (
    <div
      title={`${booking.userName} Â· ${fmtTime(booking.startTime)}â€“${fmtTime(booking.endTime)} Â· ${booking.status}`}
      className={`absolute top-1 bottom-1 rounded text-white text-xs flex items-center px-1 overflow-hidden cursor-default transition-colors
        ${colorMap[booking.status] ?? 'bg-slate-400'}`}
      style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '2px' }}
    >
      <span className="truncate hidden sm:inline">{booking.userName}</span>
    </div>
  );
}

function TimelineRow({ facility, bookings }: { facility: Facility; bookings: Booking[] }) {
  const hourLabels = Array.from({ length: CLOSE_HOUR - OPEN_HOUR + 1 }, (_, i) => OPEN_HOUR + i);

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* Facility name */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-700">{facility.name}</p>
        <p className="text-xs text-gray-400">{facility.location}</p>
      </div>

      {/* Timeline */}
      <div className="px-4 py-2">
        <div className="relative h-10">
          {/* Hour grid lines */}
          {hourLabels.map(h => (
            <div
              key={h}
              className="absolute top-0 bottom-0 border-l border-gray-100"
              style={{ left: `${((h - OPEN_HOUR) / (CLOSE_HOUR - OPEN_HOUR)) * 100}%` }}
            />
          ))}

          {/* Empty track */}
          <div className="absolute inset-y-1 left-0 right-0 bg-gray-50 rounded" />

          {/* Booking bars */}
          {bookings.filter(b => b.facilityId === facility.id && b.status !== 'Cancelled').map(b => (
            <BookingBar key={b.id} booking={b} />
          ))}
        </div>

        {/* Hour labels */}
        <div className="flex justify-between mt-1">
          {hourLabels.filter((_, i) => i % 2 === 0).map(h => (
            <span key={h} className="text-[10px] text-gray-400">
              {String(h).padStart(2, '0')}:00
            </span>
          ))}
        </div>
      </div>

      {/* Booking list for this facility */}
      {bookings.filter(b => b.facilityId === facility.id).length > 0 && (
        <div className="px-4 pb-3 space-y-1">
          {bookings.filter(b => b.facilityId === facility.id).map(b => (
            <div key={b.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">
                  {fmtTime(b.startTime)}â€“{fmtTime(b.endTime)}
                </span>
                <span className="text-gray-500">{b.userName}</span>
                <span className="text-gray-400">{b.activityName}</span>
              </div>
              <Badge label={b.status} color={bookingStatusColor(b.status)} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function OrgSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [venues,       setVenues]       = useState<VenueListItem[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [facilities,   setFacilities]   = useState<Facility[]>([]);
  const [bookings,     setBookings]     = useState<Booking[]>([]);
  const [loading,      setLoading]      = useState(true);

  // Load venues on mount
  useEffect(() => {
    venueService.getMyVenues()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setVenues(list);
        if (list.length > 0) setSelectedVenueId(list[0].id);
      })
      .catch(() => {});
  }, []);

  // Load facilities when venue changes
  useEffect(() => {
    if (!selectedVenueId) { setFacilities([]); return; }
    facilityService.getAll({ venueId: selectedVenueId })
      .then(data => setFacilities(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [selectedVenueId]);

  // Load bookings when date changes
  const loadBookings = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const data = await venueService.getMyBookings({ date: toLocalDateStr(date) });
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookings(selectedDate); }, [selectedDate, loadBookings]);

  // Date strip â€” show 7 days centred on selected date
  const stripDates = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 3));

  const facilitiesInVenue = facilities.filter(f =>
    !selectedVenueId || f.venueId === selectedVenueId
  );

  const bookingsForDate = bookings.filter(b => {
    const bDate = toLocalDateStr(new Date(b.startTime));
    return bDate === toLocalDateStr(selectedDate);
  });

  const pendingCount = bookingsForDate.filter(b => b.status === 'Pending').length;

  return (
    <div className="w-[80%] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Schedule</h2>
          <p className="text-sm text-gray-500">Venue timeline for {fmtDateHeader(selectedDate)}</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <AlertCircle size={14} />
            {pendingCount} pending on this day
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">

        {/* Venue selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <Building2 size={15} className="text-gray-400" />
          {venues.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVenueId(v.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${selectedVenueId === v.id
                  ? 'bg-[#0078D7] border-[#0078D7] text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#66b7ed]'}`}
            >
              {v.name}
            </button>
          ))}
        </div>

        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(d => addDays(d, -1))}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex gap-1 flex-1 overflow-x-auto">
            {stripDates.map(d => {
              const dayStr = toLocalDateStr(d);
              const active = dayStr === toLocalDateStr(selectedDate);
              const today  = isToday(d);
              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDate(d)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs transition-all min-w-[3.5rem]
                    ${active
                      ? 'bg-[#0078D7] text-white shadow-sm'
                      : today
                      ? 'bg-[#e6f3fc] border border-[#99cff3] text-[#0078D7]'
                      : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#66b7ed]'}`}
                >
                  <span className="font-medium">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                  <span className={`text-base font-bold ${active ? 'text-white' : 'text-gray-800'}`}>
                    {d.getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setSelectedDate(d => addDays(d, 1))}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
          >
            <ChevronRight size={15} />
          </button>

          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-xs text-[#0078D7] hover:underline px-2"
          >
            Today
          </button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <Spinner fullPage />
      ) : facilitiesInVenue.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Building2 size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm">No facilities found for this venue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Legend */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100">
            {[
              { color: 'bg-[#0087e0]', label: 'Confirmed' },
              { color: 'bg-amber-400',  label: 'Pending' },
              { color: 'bg-emerald-500', label: 'Completed' },
              { color: 'bg-gray-300',  label: 'Cancelled' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
            <span className="ml-auto text-xs text-gray-400">
              {bookingsForDate.length} booking{bookingsForDate.length !== 1 ? 's' : ''} on this day
            </span>
          </div>

          {/* Per-facility rows */}
          {facilitiesInVenue.map(f => (
            <TimelineRow
              key={f.id}
              facility={f}
              bookings={bookingsForDate}
            />
          ))}

          {bookingsForDate.length === 0 && (
            <div className="py-12 text-center">
              <CalendarDays size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-gray-400 text-sm">No bookings on this day.</p>
            </div>
          )}
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: bookingsForDate.length,                                   icon: CalendarDays, color: 'text-gray-600 bg-gray-100' },
          { label: 'Confirmed', value: bookingsForDate.filter(b => b.status === 'Confirmed').length,  icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pending',   value: pendingCount,                                              icon: Clock,        color: 'text-amber-600 bg-amber-50' },
          { label: 'Cancelled', value: bookingsForDate.filter(b => b.status === 'Cancelled').length,  icon: XCircle,      color: 'text-gray-400 bg-gray-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}><Icon size={15} /></div>
            <div>
              <p className="text-lg font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

