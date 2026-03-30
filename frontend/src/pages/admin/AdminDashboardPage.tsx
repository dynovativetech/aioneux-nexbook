import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, CalendarDays, Building2,
  MessageSquareWarning, Users, TrendingUp, ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useBookings }   from '../../hooks/useBookings';
import { useFacilities } from '../../hooks/useFacilities';
import Badge, { bookingStatusColor, complaintStatusColor } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { complaintService } from '../../services/complaintService';
import type { Complaint } from '../../types';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface DonutSegment { value: number; color: string; label: string; bg: string }

function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const r = 38;
  const circ = 2 * Math.PI * r;
  let cumPct = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0 w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="14" />
          {total === 0 ? (
            <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth="14" />
          ) : (
            segments.map((seg, i) => {
              if (seg.value === 0) return null;
              const pct  = seg.value / total;
              const dash = pct * circ;
              const off  = -(cumPct * circ);
              cumPct += pct;
              return (
                <circle key={i} cx="50" cy="50" r={r}
                  fill="none" stroke={seg.color} strokeWidth="14"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeDashoffset={off}
                />
              );
            })
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-800 leading-none">{total}</span>
          <span className="text-[10px] text-gray-400 mt-0.5">total</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-xs text-gray-600 w-20">{seg.label}</span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-lg ${seg.bg}`}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FacilityBar({ name, location, count, max }: {
  name: string; location: string; count: number; max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const barColor = pct >= 75 ? 'bg-[#0078D7]' : pct >= 40 ? 'bg-[#66b7ed]' : 'bg-gray-200';

  return (
    <div className="px-5 py-3.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
          <p className="text-xs text-gray-400">{location}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="text-sm font-bold text-gray-700">{count}</span>
          <span className="text-xs text-gray-400">bookings</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, iconBg, iconText, tag }: {
  label: string; value: number | string; icon: React.ReactNode;
  iconBg: string; iconText: string; tag?: { label: string; cls: string };
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgb(0_0_0_/_0.10)] transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
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

  useEffect(() => {
    complaintService.getAll()
      .then((r) => setComplaints(r.success ? r.data : []))
      .finally(() => setCLoading(false));
  }, []);

  if (bLoading || fLoading || cLoading) return <Spinner />;

  const activeUsers    = new Set(bookings.map((b) => b.userId)).size;
  const openComplaints = complaints.filter((c) => c.status === 'Open').length;
  const confirmed      = bookings.filter((b) => b.status === 'Confirmed').length;
  const pending        = bookings.filter((b) => b.status === 'Pending').length;
  const completed      = bookings.filter((b) => b.status === 'Completed').length;
  const cancelled      = bookings.filter((b) => b.status === 'Cancelled').length;

  const recentBookings   = [...bookings].sort((a, b) => b.id - a.id).slice(0, 6);
  const recentComplaints = [...complaints].sort((a, b) => b.id - a.id).slice(0, 5);

  const facilityStats = facilities
    .map((f) => ({ ...f, count: bookings.filter((b) => b.facilityId === f.id).length }))
    .sort((a, b) => b.count - a.count);

  const maxFacilityCount = Math.max(...facilityStats.map((f) => f.count), 1);

  const donutSegments = [
    { label: 'Confirmed', value: confirmed, color: '#10b981', bg: 'bg-emerald-50 text-emerald-700' },
    { label: 'Pending',   value: pending,   color: '#f59e0b', bg: 'bg-amber-50 text-amber-700' },
    { label: 'Completed', value: completed, color: '#0078D7', bg: 'bg-[#e6f3fc] text-[#025DB6]' },
    { label: 'Cancelled', value: cancelled, color: '#ef4444', bg: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">

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
          <Link
            to="/admin/complaints"
            className="flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-colors font-medium"
          >
            <AlertCircle size={13} />
            {openComplaints} open complaint{openComplaints > 1 ? 's' : ''}
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={bookings.length}
          icon={<CalendarDays size={18} />} iconBg="bg-[#e6f3fc]" iconText="text-[#0078D7]" />
        <StatCard label="Active Users" value={activeUsers}
          icon={<Users size={18} />} iconBg="bg-[#e6f3fc]" iconText="text-[#0078D7]"
          tag={activeUsers > 0 ? { label: 'Engaged', cls: 'bg-[#e6f3fc] text-[#0078D7]' } : undefined} />
        <StatCard label="Facilities" value={facilities.length}
          icon={<Building2 size={18} />} iconBg="bg-emerald-50" iconText="text-emerald-600" />
        <StatCard label="Open Complaints" value={openComplaints}
          icon={<MessageSquareWarning size={18} />} iconBg="bg-amber-50" iconText="text-amber-600"
          tag={openComplaints > 0 ? { label: 'Needs review', cls: 'bg-amber-50 text-amber-600' } : undefined} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Booking Status Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Booking Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribution across all bookings</p>
          </div>
          <div className="px-5 py-5">
            <DonutChart segments={donutSegments} />
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-gray-50">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{confirmed}</p>
                <p className="text-xs text-gray-400">Confirmed now</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#0078D7]">
                  {bookings.length > 0 ? Math.round((completed / bookings.length) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-400">Completion rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Facility utilisation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Facilities Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Bookings per facility</p>
            </div>
            <TrendingUp size={15} className="text-gray-300" />
          </div>
          {facilityStats.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No facilities yet.</div>
          ) : (
            <div>{facilityStats.map((f) => (
              <FacilityBar key={f.id} name={f.name} location={f.location} count={f.count} max={maxFacilityCount} />
            ))}</div>
          )}
        </div>
      </div>

      {/* Tables row */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Recent Bookings</h3>
            <Link to="/admin/bookings" className="text-xs text-[#0078D7] hover:underline flex items-center gap-1 font-medium">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No bookings yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentBookings.map((b) => (
                <div key={b.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/60 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-[#e6f3fc] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#025DB6]">
                      {b.userName?.split(' ').map((n) => n[0]?.toUpperCase()).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{b.userName}</p>
                    <p className="text-xs text-gray-400">{b.facilityName} Â· {fmtDate(b.startTime)}</p>
                  </div>
                  <Badge label={b.status} color={bookingStatusColor(b.status)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Complaints */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Complaints</h3>
            <Link to="/admin/complaints" className="text-xs text-[#0078D7] hover:underline flex items-center gap-1 font-medium">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentComplaints.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No complaints yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentComplaints.map((c) => (
                <div key={c.id} className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                    <Badge label={c.status} color={complaintStatusColor(c.status)} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{c.userName} Â· {fmtDate(c.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

