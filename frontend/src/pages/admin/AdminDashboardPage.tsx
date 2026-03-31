import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Building2, MapPin,
  MessageSquareWarning, Users, ArrowRight,
  AlertCircle, ChevronLeft, ChevronRight,
  Tag, MessageCircle, Hash,
} from 'lucide-react';
import { useBookings }   from '../../hooks/useBookings';
import { useFacilities } from '../../hooks/useFacilities';
import Badge, { bookingStatusColor, complaintStatusColor } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { complaintService } from '../../services/complaintService';
import { venueService } from '../../services/venueService';
import { userService } from '../../services/userService';
import type { Booking, Complaint } from '../../types';

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysUntilLabel(iso: string): { label: string; cls: string } {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (diff < 0)   return { label: 'Past',       cls: 'bg-gray-100 text-gray-500' };
  if (diff === 0) return { label: 'Today',      cls: 'bg-emerald-100 text-emerald-700' };
  if (diff === 1) return { label: 'Tomorrow',   cls: 'bg-[#e6f3fc] text-[#025DB6]' };
  return           { label: `In ${diff}d`,      cls: 'bg-[#e6f3fc] text-[#025DB6]' };
}

function DashBookingRow({ b }: { b: Booking }) {
  const { label, cls } = daysUntilLabel(b.startTime);
  const dt = new Date(b.startTime);
  return (
    <div className="flex items-stretch hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 w-[56px] flex flex-col items-center justify-center bg-gradient-to-b from-[#e8f3fd] to-[#daeefb] border-r border-[#c5def6] py-3 gap-0">
        <span className="text-[9px] font-extrabold text-[#0078D7] uppercase tracking-widest leading-none">
          {dt.toLocaleDateString('en-GB', { month: 'short' })}
        </span>
        <span className="text-[24px] font-black text-[#025DB6] leading-tight">{dt.getDate()}</span>
        <span className="text-[9px] font-semibold text-[#0078D7]/70 uppercase tracking-wider leading-none">
          {dt.toLocaleDateString('en-GB', { weekday: 'short' })}
        </span>
      </div>
      <div className="flex-1 min-w-0 px-4 py-2.5 flex flex-col justify-center gap-0.5">
        {(b.venueName || b.communityName) && (
          <p className="text-[10px] font-bold text-[#0078D7] uppercase tracking-widest truncate leading-none">
            {[b.venueName, b.communityName].filter(Boolean).join(', ')}
          </p>
        )}
        <p className="text-sm font-bold text-gray-800 truncate leading-snug">{b.facilityName}</p>
        <p className="text-xs text-gray-500 tabular-nums truncate">
          {b.activityName ? <span className="text-gray-400">{b.activityName} · </span> : null}
          <span className="font-semibold text-gray-600">{fmtTime(b.startTime)} – {fmtTime(b.endTime)}</span>
        </p>
        <p className="text-[10px] text-gray-400">
          <span className="font-medium text-gray-600">{b.userName}</span>
          {' · '}#{b.id}
        </p>
      </div>
      <div className="flex-shrink-0 flex flex-col items-end justify-center gap-1.5 pr-4 pl-2 py-2.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{label}</span>
        <Badge label={b.status} color={bookingStatusColor(b.status)} />
      </div>
    </div>
  );
}

function stripeColor(status: string) {
  const m: Record<string, string> = {
    Open: 'bg-amber-400', InProgress: 'bg-[#0078D7]', Resolved: 'bg-emerald-500',
    Closed: 'bg-gray-400', Cancelled: 'bg-gray-300', ActionRequired: 'bg-red-500',
    MoreInfoRequired: 'bg-yellow-400',
  };
  return m[status] ?? 'bg-gray-300';
}

function DashComplaintRow({ c }: { c: Complaint }) {
  const dt = new Date(c.createdAt);
  return (
    <div className="flex items-stretch hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-0">
      <div className={`flex-shrink-0 w-1 self-stretch ${stripeColor(c.status)}`} />
      <div className="flex-1 min-w-0 px-4 py-2.5 flex flex-col gap-0.5">
        <p className="text-sm font-bold text-gray-800 truncate leading-snug">{c.title}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-wrap">
          <span className="font-medium text-gray-600">{c.userName}</span>
          {c.category && (
            <><span className="text-gray-200">·</span>
            <span className="flex items-center gap-0.5 text-[#0078D7] font-semibold"><Tag size={9}/>{c.category}</span></>
          )}
          <span className="text-gray-200">·</span>
          <span>{dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          <span className="tabular-nums">{dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
          {c.bookingId && <><span className="text-gray-200">·</span><span className="flex items-center gap-0.5"><Hash size={9}/>#{c.bookingId}</span></>}
        </div>
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1 px-3 py-2.5">
        <Badge label={c.status} color={complaintStatusColor(c.status)} />
        <span className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
          <MessageCircle size={10}/>{c.comments.length} msg{c.comments.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

interface DonutSegment { value: number; color: string; label: string; bg: string }

function DonutChart({ segments, variant = 'default' }: { segments: DonutSegment[]; variant?: 'default' | 'large' }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const isLarge = variant === 'large';
  /* Dashboard row: keep chart readable but compact so card height matches 2×2 stat tiles */
  const r = isLarge ? 38 : 38;
  const strokeW = 14;
  const circ = 2 * Math.PI * r;
  let cumPct = 0;

  return (
    <div className={`flex items-center ${isLarge ? 'flex-col sm:flex-row gap-5 sm:gap-7 w-full' : 'gap-6'}`}>
      <div className={`relative flex-shrink-0 ${isLarge ? 'w-32 h-32 sm:w-36 sm:h-36' : 'w-28 h-28'}`}>
        <svg viewBox="0 0 100 100" className={`${isLarge ? 'w-32 h-32 sm:w-36 sm:h-36' : 'w-28 h-28'} -rotate-90`}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
          {total === 0 ? (
            <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth={strokeW} />
          ) : (
            segments.map((seg, i) => {
              if (seg.value === 0) return null;
              const pct  = seg.value / total;
              const dash = pct * circ;
              const off  = -(cumPct * circ);
              cumPct += pct;
              return (
                <circle key={i} cx="50" cy="50" r={r}
                  fill="none" stroke={seg.color} strokeWidth={strokeW}
                  strokeDasharray={`${dash} ${circ}`}
                  strokeDashoffset={off}
                />
              );
            })
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-gray-800 leading-none tabular-nums ${isLarge ? 'text-xl sm:text-2xl' : 'text-xl'}`}>{total}</span>
          <span className="text-gray-400 text-[10px] mt-0.5">total</span>
        </div>
      </div>
      <div className={isLarge ? 'space-y-1.5 min-w-0 flex-1 w-full sm:max-w-[13rem]' : 'space-y-2'}>
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 sm:gap-2.5">
            <span
              className={`rounded-full flex-shrink-0 ${isLarge ? 'w-2.5 h-2.5 sm:w-3 sm:h-3' : 'w-2.5 h-2.5'}`}
              style={{ background: seg.color }}
            />
            <span className={`text-gray-700 font-semibold truncate ${isLarge ? 'text-xs sm:text-sm flex-1 min-w-0' : 'text-xs w-20'}`}>
              {seg.label}
            </span>
            <span className={`font-bold tabular-nums rounded-md flex-shrink-0 ${isLarge ? 'text-xs px-2 py-0.5' : 'text-xs px-1.5 py-0.5'} ${seg.bg}`}>
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, iconBg, iconText, tag }: {
  label: string; value: number | string; icon: React.ReactNode;
  iconBg: string; iconText: string; tag?: { label: string; cls: string };
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgb(0_0_0_/_0.10)] transition-all duration-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <span className={iconText}>{icon}</span>
        </div>
        {tag && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tag.cls}`}>
            {tag.label}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { bookings, loading: bLoading }   = useBookings();
  const { facilities, loading: fLoading } = useFacilities();
  const [complaints, setComplaints]       = useState<Complaint[]>([]);
  const [cLoading, setCLoading]           = useState(true);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [activeVenueCount, setActiveVenueCount]     = useState(0);
  const [memberPortalCount, setMemberPortalCount] = useState(0);

  // Pagination state for recent tables
  const [bookingPage,    setBookingPage]    = useState(1);
  const [complaintPage,  setComplaintPage]  = useState(1);
  const TABLE_SIZE = 10;

  useEffect(() => {
    complaintService.getAll()
      .then((r) => setComplaints(r.success ? r.data : []))
      .finally(() => setCLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      venueService
        .list({ activeOnly: false })
        .then((list) => {
          const arr = Array.isArray(list) ? list : [];
          return arr.filter((v) => v.isActive).length;
        })
        .catch(() => 0),
      userService.getMemberCount().catch(() => 0),
    ])
      .then(([venues, members]) => {
        if (!cancelled) {
          setActiveVenueCount(venues);
          setMemberPortalCount(members);
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // All derived values before early return
  const activeFacilities = facilities.filter((f) => f.isActive).length;
  const openComplaints = complaints.filter((c) => c.status === 'Open').length;
  const confirmed      = bookings.filter((b) => b.status === 'Confirmed').length;
  const pending        = bookings.filter((b) => b.status === 'Pending').length;
  const completed      = bookings.filter((b) => b.status === 'Completed').length;
  const cancelled      = bookings.filter((b) => b.status === 'Cancelled').length;
  const completionRate = bookings.length > 0 ? Math.round((completed / bookings.length) * 100) : 0;

  const sortedBookings   = [...bookings].sort((a, b) => b.id - a.id);
  const sortedComplaints = [...complaints].sort((a, b) => b.id - a.id);
  const totalBPages = Math.ceil(sortedBookings.length / TABLE_SIZE);
  const totalCPages = Math.ceil(sortedComplaints.length / TABLE_SIZE);
  const pagedBookings    = sortedBookings.slice((bookingPage - 1) * TABLE_SIZE, bookingPage * TABLE_SIZE);
  const pagedComplaints  = sortedComplaints.slice((complaintPage - 1) * TABLE_SIZE, complaintPage * TABLE_SIZE);

  const donutSegments = [
    { label: 'Confirmed', value: confirmed, color: '#10b981', bg: 'bg-emerald-50 text-emerald-700' },
    { label: 'Pending',   value: pending,   color: '#f59e0b', bg: 'bg-amber-50 text-amber-700'    },
    { label: 'Completed', value: completed, color: '#0078D7', bg: 'bg-[#e6f3fc] text-[#025DB6]'  },
    { label: 'Cancelled', value: cancelled, color: '#ef4444', bg: 'bg-red-50 text-red-600'        },
  ];

  if (bLoading || fLoading || cLoading || statsLoading) return <Spinner />;

  return (
    <div className="w-[80%] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0078D7] to-[#025DB6] flex items-center justify-center shadow-[0_4px_12px_-2px_rgb(0_120_215_/_0.40)]">
            <ShieldCheck size={19} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-xl leading-tight">Admin Overview</h2>
            <p className="text-sm text-gray-500 mt-0.5">Platform-wide stats and activity</p>
          </div>
        </div>
        {openComplaints > 0 && (
          <Link to="/admin/complaints"
            className="flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-colors font-medium">
            <AlertCircle size={13} />
            {openComplaints} open complaint{openComplaints > 1 ? 's' : ''}
          </Link>
        )}
      </div>

      {/* ── Top row: Booking Status donut (left) + 2×2 stat cards (right) ── */}
      <div className="grid lg:grid-cols-5 gap-4 lg:items-stretch">

        {/* Booking Status — spans 3 of 5 cols; height matched to stat grid via compact padding */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] flex flex-col h-full">
          <div className="px-4 py-3 sm:px-5 border-b border-gray-100 flex-shrink-0">
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Booking Status</h3>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-snug">Distribution across all {bookings.length} bookings</p>
          </div>
          <div className="px-4 py-3 sm:px-5 flex flex-1 items-center min-h-0">
            <DonutChart segments={donutSegments} variant="large" />
          </div>
          <div className="px-4 py-2 sm:px-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-50 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500">
              <span className="font-semibold text-emerald-600">{confirmed}</span> confirmed now
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500">
              <span className="font-semibold text-[#0078D7]">{completionRate}%</span> completion rate
            </div>
          </div>
        </div>

        {/* 2×2 stat cards — spans 2 of 5 cols */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4 h-full min-h-0">
          <StatCard label="Venues" value={activeVenueCount}
            icon={<MapPin size={18} />} iconBg="bg-[#e6f3fc]" iconText="text-[#0078D7]"
            tag={activeVenueCount > 0 ? { label: 'Active', cls: 'bg-[#e6f3fc] text-[#0078D7]' } : undefined} />
          <StatCard label="Members" value={memberPortalCount}
            icon={<Users size={18} />} iconBg="bg-[#e6f3fc]" iconText="text-[#0078D7]"
            tag={memberPortalCount > 0 ? { label: 'Portal', cls: 'bg-[#e6f3fc] text-[#0078D7]' } : undefined} />
          <StatCard label="Facilities" value={activeFacilities}
            icon={<Building2 size={18} />} iconBg="bg-emerald-50" iconText="text-emerald-600"
            tag={activeFacilities > 0 ? { label: 'Active', cls: 'bg-emerald-50 text-emerald-600' } : undefined} />
          <StatCard label="Open Complaints" value={openComplaints}
            icon={<MessageSquareWarning size={18} />} iconBg="bg-amber-50" iconText="text-amber-600"
            tag={openComplaints > 0 ? { label: 'Review', cls: 'bg-amber-50 text-amber-600' } : undefined} />
        </div>
      </div>

      {/* ── Recent Bookings — full width ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Recent Bookings</h3>
            <p className="text-xs text-gray-400 mt-0.5">{bookings.length} total</p>
          </div>
          <Link to="/admin/bookings" className="text-xs text-[#0078D7] hover:underline flex items-center gap-1 font-medium">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {sortedBookings.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No bookings yet.</div>
        ) : (
          <>
            <div>
              {pagedBookings.map((b) => <DashBookingRow key={b.id} b={b} />)}
            </div>
            {totalBPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                <span className="text-xs text-gray-400">
                  Page {bookingPage} of {totalBPages}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setBookingPage(p => Math.max(1, p - 1))} disabled={bookingPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                    <ChevronLeft size={13} />
                  </button>
                  <button onClick={() => setBookingPage(p => Math.min(totalBPages, p + 1))} disabled={bookingPage === totalBPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Recent Complaints — full width ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Complaints</h3>
            <p className="text-xs text-gray-400 mt-0.5">{complaints.length} total</p>
          </div>
          <Link to="/admin/complaints" className="text-xs text-[#0078D7] hover:underline flex items-center gap-1 font-medium">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {sortedComplaints.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No complaints yet.</div>
        ) : (
          <>
            <div>
              {pagedComplaints.map((c) => <DashComplaintRow key={c.id} c={c} />)}
            </div>
            {totalCPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                <span className="text-xs text-gray-400">
                  Page {complaintPage} of {totalCPages}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setComplaintPage(p => Math.max(1, p - 1))} disabled={complaintPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                    <ChevronLeft size={13} />
                  </button>
                  <button onClick={() => setComplaintPage(p => Math.min(totalCPages, p + 1))} disabled={complaintPage === totalCPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}

