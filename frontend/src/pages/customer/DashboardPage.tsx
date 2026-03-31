import { Link } from 'react-router-dom';
import {
  CalendarPlus, CalendarDays,
  CheckCircle2, Clock3, XCircle, ArrowRight,
  CheckCheck, AlertCircle,
} from 'lucide-react';
import { useAuth }     from '../../context/AuthContext';
import { useBookings } from '../../hooks/useBookings';
import Badge, { bookingStatusColor } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import type { Booking } from '../../types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function daysUntilLabel(iso: string): { label: string; cls: string } {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (diff < 0)   return { label: 'Past',       cls: 'bg-gray-100 text-gray-500' };
  if (diff === 0) return { label: 'Today',      cls: 'bg-emerald-100 text-emerald-700' };
  if (diff === 1) return { label: 'Tomorrow',   cls: 'bg-[#e6f3fc] text-[#025DB6]' };
  return           { label: `In ${diff} days`,  cls: 'bg-[#e6f3fc] text-[#025DB6]' };
}

function StatCard({ label, value, icon, iconBg, iconText }: {
  label: string; value: number | string;
  icon: React.ReactNode; iconBg: string; iconText: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgb(0_0_0_/_0.10)] transition-all duration-200">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className={iconText}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function UpcomingCard({ b }: { b: Booking }) {
  const { label, cls } = daysUntilLabel(b.startTime);
  const dt = new Date(b.startTime);

  return (
    <div className="flex items-stretch border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors">

      {/* ── Col 1: Date block ── */}
      <div className="flex-shrink-0 w-[60px] flex flex-col items-center justify-center bg-gradient-to-b from-[#e8f3fd] to-[#daeefb] border-r border-[#c5def6] py-4 gap-0">
        <span className="text-[9px] font-extrabold text-[#0078D7] uppercase tracking-widest leading-none">
          {dt.toLocaleDateString('en-GB', { month: 'short' })}
        </span>
        <span className="text-[28px] font-black text-[#025DB6] leading-tight">
          {dt.getDate()}
        </span>
        <span className="text-[9px] font-semibold text-[#0078D7]/70 uppercase tracking-wider leading-none">
          {dt.toLocaleDateString('en-GB', { weekday: 'short' })}
        </span>
      </div>

      {/* ── Col 2: Venue / Facility / Time ── */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center gap-0.5">
        {(b.venueName || b.communityName) && (
          <p className="text-[10px] font-bold text-[#0078D7] uppercase tracking-widest truncate leading-none">
            {[b.venueName, b.communityName].filter(Boolean).join(', ')}
          </p>
        )}
        <p className="text-sm font-bold text-gray-800 truncate leading-snug">
          {b.facilityName}
        </p>
        <p className="text-xs text-gray-500 tabular-nums truncate">
          {b.activityName ? <span className="text-gray-400">{b.activityName} · </span> : null}
          <span className="font-semibold text-gray-600">{fmtTime(b.startTime)} – {fmtTime(b.endTime)}</span>
        </p>
        {b.instructorName && (
          <p className="text-[11px] text-gray-400 truncate">with {b.instructorName}</p>
        )}
      </div>

      {/* ── Col 4: Countdown + Status ── */}
      <div className="flex-shrink-0 flex flex-col items-end justify-center gap-1.5 pr-4 pl-2 py-3">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>
          {label}
        </span>
        <Badge label={b.status} color={bookingStatusColor(b.status)} />
      </div>
    </div>
  );
}

function ActivityItem({ b, isLast }: { b: Booking; isLast: boolean }) {
  const cfg: Record<string, { dot: string; icon: React.ReactNode; verb: string }> = {
    Confirmed: {
      dot: 'bg-emerald-500',
      icon: <CheckCheck size={13} className="text-emerald-600" />,
      verb: 'Booking confirmed for',
    },
    Pending: {
      dot: 'bg-amber-400',
      icon: <Clock3 size={13} className="text-amber-500" />,
      verb: 'Booking submitted for',
    },
    Completed: {
      dot: 'bg-[#0078D7]',
      icon: <CheckCircle2 size={13} className="text-[#0078D7]" />,
      verb: 'Session completed at',
    },
    Cancelled: {
      dot: 'bg-red-400',
      icon: <XCircle size={13} className="text-red-500" />,
      verb: 'Booking cancelled for',
    },
  };
  const c = cfg[b.status] ?? {
    dot: 'bg-gray-300',
    icon: <AlertCircle size={13} className="text-gray-400" />,
    verb: 'Activity for',
  };

  return (
    <div className="flex gap-3">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${c.dot}`} />
        {!isLast && <div className="flex-1 w-px bg-gray-100 mt-1 min-h-[20px]" />}
      </div>

      {/* Content */}
      <div className={`${isLast ? '' : 'pb-4'} min-w-0 flex-1`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex-shrink-0">{c.icon}</span>
            <p className="text-sm text-gray-700 truncate">
              <span className="text-gray-500">{c.verb} </span>
              <span className="font-medium text-gray-800">{b.facilityName}</span>
            </p>
          </div>
          <Badge label={b.status} color={bookingStatusColor(b.status)} />
        </div>
        <p className="text-xs text-gray-400 mt-0.5 pl-5">
          {b.activityName} · {fmtDate(b.startTime)}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user }              = useAuth();
  const { bookings, loading } = useBookings();

  const mine     = bookings.filter((b) => b.userId === user?.id);
  const upcoming = mine
    .filter((b) => (b.status === 'Confirmed' || b.status === 'Pending') && new Date(b.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);
  const activity = [...mine].sort((a, b) => b.id - a.id).slice(0, 15);

  if (loading) return <Spinner />;

  return (
    <div className="w-[80%] mx-auto space-y-6">

      {/* Greeting banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0078D7] to-[#025DB6] rounded-2xl px-6 py-5 text-white shadow-[0_4px_20px_-4px_rgb(0_120_215_/_0.45)]">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold leading-tight">
              {greeting()}, {user?.fullName.split(' ')[0]}!
            </h2>
            <p className="text-blue-100 mt-1 text-sm">
              {upcoming.length > 0
                ? `You have ${upcoming.length} upcoming booking${upcoming.length > 1 ? 's' : ''}.`
                : 'No upcoming bookings — ready to schedule something?'}
            </p>
          </div>
          <Link
            to="/book"
            className="hidden sm:flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap border border-white/20"
          >
            <CalendarPlus size={16} /> New Booking
          </Link>
        </div>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -right-4 w-32 h-32 rounded-full bg-white/5" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Bookings"
          value={mine.length}
          icon={<CalendarDays size={20} />} iconBg="bg-[#e6f3fc]" iconText="text-[#0078D7]" />
        <StatCard label="Upcoming"
          value={upcoming.length}
          icon={<Clock3 size={20} />} iconBg="bg-amber-50" iconText="text-amber-600" />
        <StatCard label="Completed"
          value={mine.filter((b) => b.status === 'Completed').length}
          icon={<CheckCircle2 size={20} />} iconBg="bg-emerald-50" iconText="text-emerald-600" />
        <StatCard label="Cancelled"
          value={mine.filter((b) => b.status === 'Cancelled').length}
          icon={<XCircle size={20} />} iconBg="bg-red-50" iconText="text-red-500" />
      </div>

      {/* ── Upcoming Bookings — full width ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Upcoming Bookings</h3>
            <p className="text-xs text-gray-400 mt-0.5">Your next scheduled sessions</p>
          </div>
          <Link to="/my-bookings" className="text-xs text-[#0078D7] hover:underline flex items-center gap-1 font-medium">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <CalendarDays size={20} className="text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">No upcoming bookings</p>
              <p className="text-xs text-gray-400 mt-1">Your confirmed sessions will appear here.</p>
            </div>
            <Link
              to="/book"
              className="mt-1 text-xs bg-gradient-to-r from-[#0078D7] to-[#025DB6] text-white px-4 py-1.5 rounded-xl hover:opacity-90 transition-opacity font-medium"
            >
              Book now
            </Link>
          </div>
        ) : (
          <div>{upcoming.map((b) => <UpcomingCard key={b.id} b={b} />)}</div>
        )}
      </div>

      {/* ── Activity Feed ── */}
      {activity.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Activity Feed</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your recent booking activity</p>
            </div>
            <Link to="/activity-feed" className="text-xs text-[#0078D7] hover:underline flex items-center gap-1 font-medium">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="px-5 py-4">
            {activity.map((b, i) => (
              <ActivityItem key={b.id} b={b} isLast={i === activity.length - 1} />
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Link
              to="/activity-feed"
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0078D7] hover:text-[#025DB6] hover:underline transition-colors"
            >
              View all activities <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
