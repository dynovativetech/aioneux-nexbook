import { useState, useMemo } from 'react';
import {
  Activity, CalendarDays, CheckCheck, Clock3, XCircle,
  AlertCircle, CheckCircle2, ArrowRight, Filter,
} from 'lucide-react';
import { useAuth }     from '../../context/AuthContext';
import { useBookings } from '../../hooks/useBookings';
import Badge, { bookingStatusColor } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { Link } from 'react-router-dom';
import type { Booking } from '../../types';

type StatusFilter = 'All' | 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
const STATUS_FILTERS: StatusFilter[] = ['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG: Record<string, { dot: string; icon: React.ReactNode; verb: string; bg: string }> = {
  Confirmed: {
    dot: 'bg-emerald-500',
    icon: <CheckCheck size={14} className="text-emerald-600" />,
    verb: 'Booking confirmed',
    bg: 'bg-emerald-50',
  },
  Pending: {
    dot: 'bg-amber-400',
    icon: <Clock3 size={14} className="text-amber-500" />,
    verb: 'Booking pending',
    bg: 'bg-amber-50',
  },
  Completed: {
    dot: 'bg-blue-500',
    icon: <CheckCircle2 size={14} className="text-[#0078D7]" />,
    verb: 'Session completed',
    bg: 'bg-[#e6f3fc]',
  },
  Cancelled: {
    dot: 'bg-red-400',
    icon: <XCircle size={14} className="text-red-500" />,
    verb: 'Booking cancelled',
    bg: 'bg-red-50',
  },
};

function ActivityRow({ b }: { b: Booking }) {
  const cfg = STATUS_CONFIG[b.status] ?? {
    dot: 'bg-gray-300',
    icon: <AlertCircle size={14} className="text-gray-400" />,
    verb: 'Activity',
    bg: 'bg-gray-50',
  };
  const dt = new Date(b.startTime);

  return (
    <div className="flex items-stretch hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-0">

      {/* Coloured left dot stripe */}
      <div className="flex-shrink-0 w-1 self-stretch rounded-l-none">
        <div className={`w-full h-full ${cfg.dot} opacity-70`} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col gap-0.5">
        {/* Status chip + venue */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg ${cfg.bg}`}>
            {cfg.icon}
            {cfg.verb}
          </span>
          {(b.venueName || b.communityName) && (
            <span className="text-[10px] font-bold text-[#0078D7] uppercase tracking-widest truncate">
              {[b.venueName, b.communityName].filter(Boolean).join(', ')}
            </span>
          )}
        </div>

        {/* Facility */}
        <p className="text-sm font-bold text-gray-800 truncate">
          {b.facilityName}
          {b.activityName && (
            <span className="text-xs font-normal text-gray-400 ml-1.5">· {b.activityName}</span>
          )}
        </p>

        {/* Date + time */}
        <p className="text-xs text-gray-500 tabular-nums">
          {fmtDate(dt.toISOString())}
          <span className="text-gray-300 mx-1.5">·</span>
          {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
        </p>
      </div>

      {/* Badge + ID */}
      <div className="flex flex-col items-end justify-center gap-1 pr-4 py-3 flex-shrink-0">
        <Badge label={b.status} color={bookingStatusColor(b.status)} />
        <span className="text-[10px] text-gray-300">#{b.id}</span>
      </div>
    </div>
  );
}

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export default function ActivityFeedPage() {
  const { user }              = useAuth();
  const { bookings, loading } = useBookings();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  // All bookings for this user, newest first
  const mine = useMemo(
    () => bookings
      .filter((b) => b.userId === user?.id)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [bookings, user?.id],
  );

  // One-month window: from 30 days ago to 30 days ahead
  const oneMonthAgo  = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; }, []);
  const oneMonthAhead = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; }, []);

  const inWindow = useMemo(() =>
    mine.filter((b) => {
      const t = new Date(b.startTime);
      return t >= oneMonthAgo && t <= oneMonthAhead;
    }),
    [mine, oneMonthAgo, oneMonthAhead],
  );

  const filtered = statusFilter === 'All'
    ? inWindow
    : inWindow.filter((b) => b.status === statusFilter);

  // Group by Month Year
  const grouped = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of filtered) {
      const key = monthLabel(b.startTime);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return [...map.entries()];
  }, [filtered]);

  if (loading) return <Spinner />;

  return (
    <div className="w-[80%] mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity size={20} className="text-[#0078D7]" />
            Activity Feed
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Your booking activity for the past &amp; next 30 days
          </p>
        </div>
        <Link
          to="/my-bookings"
          className="flex items-center gap-1.5 text-xs text-[#0078D7] hover:underline font-medium"
        >
          All bookings <ArrowRight size={12} />
        </Link>
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-gray-400 flex-shrink-0" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              statusFilter === f
                ? 'bg-[#0078D7] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
            {f !== 'All' && (
              <span className="ml-1 opacity-60">
                ({inWindow.filter((b) => b.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] py-20 text-center">
          <CalendarDays size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">No activity in this period</p>
          <p className="text-sm text-gray-400 mt-1">
            {statusFilter !== 'All' ? 'Try selecting a different status filter.' : 'Your booking activity will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
          {grouped.map(([month, items], gi) => (
            <div key={month}>
              {/* Month section header */}
              <div className={`flex items-center gap-3 px-5 py-2.5 bg-gray-50/80 ${gi > 0 ? 'border-t border-gray-100' : ''}`}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                  {month}
                </span>
                <div className="flex-1 h-px bg-gray-200/60" />
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  {items.length} event{items.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Rows */}
              {items.map((b) => (
                <ActivityRow key={b.id} b={b} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
