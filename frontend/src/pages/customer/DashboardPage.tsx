import { Link } from 'react-router-dom';
import {
  CalendarPlus, CalendarDays, MessageSquareWarning,
  CheckCircle2, Clock3, XCircle, ArrowRight, Zap,
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
  if (diff < 0)    return { label: 'Past',        cls: 'bg-gray-100 text-gray-500' };
  if (diff === 0)  return { label: 'Today',       cls: 'bg-emerald-100 text-emerald-700' };
  if (diff === 1)  return { label: 'Tomorrow',    cls: 'bg-[#e6f3fc] text-[#025DB6]' };
  return           { label: `In ${diff} days`,    cls: 'bg-[#e6f3fc] text-[#025DB6]' };
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
  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
      {/* Date block */}
      <div className="flex-shrink-0 w-12 text-center bg-[#e6f3fc] rounded-xl py-2">
        <p className="text-[10px] text-[#0078D7] font-semibold uppercase leading-none">
          {new Date(b.startTime).toLocaleDateString('en-GB', { month: 'short' })}
        </p>
        <p className="text-xl font-bold text-[#025DB6] leading-tight">
          {new Date(b.startTime).getDate()}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{b.facilityName}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {b.activityName} · {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
        </p>
        {b.instructorName && (
          <p className="text-xs text-gray-400 mt-0.5">with {b.instructorName}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
        <Badge label={b.status} color={bookingStatusColor(b.status)} />
      </div>
    </div>
  );
}

function TimelineItem({ b, isLast }: { b: Booking; isLast: boolean }) {
  const dotCls: Record<string, string> = {
    Confirmed: 'bg-emerald-500',
    Pending:   'bg-amber-400',
    Completed: 'bg-[#0078D7]',
    Cancelled: 'bg-red-400',
  };
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full mt-1 ${dotCls[b.status] ?? 'bg-gray-300'}`} />
        {!isLast && <div className="flex-1 w-px bg-gray-100 mt-1" />}
      </div>
      <div className={`${isLast ? '' : 'pb-4'} min-w-0 flex-1`}>
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm text-gray-800 truncate">{b.facilityName}</p>
          <Badge label={b.status} color={bookingStatusColor(b.status)} />
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{b.activityName} · {fmtDate(b.startTime)}</p>
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
    .slice(0, 4);
  const recent   = [...mine].sort((a, b) => b.id - a.id).slice(0, 6);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

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
        {/* Decorative circles */}
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

      {/* Main grid: Upcoming + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Upcoming bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
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

        {/* Quick actions */}
        <div className="flex flex-col gap-4">
          {/* Primary CTA */}
          <Link
            to="/book"
            className="relative overflow-hidden bg-gradient-to-br from-[#0078D7] to-[#025DB6] text-white rounded-2xl p-5 shadow-[0_4px_16px_-4px_rgb(0_120_215_/_0.45)] hover:shadow-[0_8px_24px_-4px_rgb(0_120_215_/_0.50)] hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <Zap size={18} className="text-white" />
              </div>
              <p className="font-bold text-base">Quick Booking</p>
              <p className="text-blue-100 text-xs mt-0.5">Reserve a facility now</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-blue-200 group-hover:text-white transition-colors">
                Get started <ArrowRight size={12} />
              </div>
            </div>
          </Link>

          {/* Secondary actions */}
          {[
            { to: '/my-bookings', icon: CalendarDays,         label: 'My Bookings',   desc: 'View & manage' },
            { to: '/complaints',  icon: MessageSquareWarning, label: 'Report Issue',  desc: 'Submit a complaint' },
          ].map(({ to, icon: Icon, label, desc }) => (
            <Link key={to} to={to}
              className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-4 flex items-center gap-3 hover:border-[#99cff3] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgb(0_0_0_/_0.10)] transition-all duration-200 group"
            >
              <div className="w-9 h-9 bg-gray-50 group-hover:bg-[#e6f3fc] rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                <Icon size={17} className="text-gray-400 group-hover:text-[#0078D7] transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ArrowRight size={14} className="ml-auto text-gray-300 group-hover:text-[#0078D7] transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Recent Activity</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your booking history</p>
            </div>
            <Link to="/my-bookings" className="text-xs text-[#0078D7] hover:underline flex items-center gap-1 font-medium">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="px-5 py-4">
            {recent.map((b, i) => (
              <TimelineItem key={b.id} b={b} isLast={i === recent.length - 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
