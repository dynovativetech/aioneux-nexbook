import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, CheckCircle2, Clock, XCircle,
  Building2, ArrowRight, MapPin, Users,
} from 'lucide-react';
import { venueService, type VenueListItem } from '../../services/venueService';
import type { Booking } from '../../types';
import Badge, { bookingStatusColor } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  catch { return iso; }
}

function StatCard({ label, value, icon: Icon, iconBg, iconText }: {
  label: string; value: number | string; icon: React.ElementType; iconBg: string; iconText: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgb(0_0_0_/_0.10)] transition-all duration-200">
      <div className={`inline-flex p-2.5 rounded-xl ${iconBg} mb-3`}>
        <Icon size={18} className={iconText} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function OrgDashboardPage() {
  const navigate = useNavigate();

  const [venues,   setVenues]   = useState<VenueListItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      venueService.getMyVenues().catch(() => [] as VenueListItem[]),
      venueService.getMyBookings().catch(() => [] as Booking[]),
    ]).then(([v, b]) => {
      setVenues(Array.isArray(v) ? v : []);
      setBookings(Array.isArray(b) ? b : []);
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date().toDateString();
  const todayBookings  = bookings.filter(b => new Date(b.startTime).toDateString() === today);
  const pendingCount   = bookings.filter(b => b.status === 'Pending').length;
  const confirmedToday = todayBookings.filter(b => b.status === 'Confirmed').length;
  const cancelledToday = todayBookings.filter(b => b.status === 'Cancelled').length;
  const recentPending  = bookings.filter(b => b.status === 'Pending').slice(0, 5);
  const upcoming       = bookings
    .filter(b => b.status === 'Confirmed' && new Date(b.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  if (loading) return <Spinner fullPage />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Dashboard</h2>
          <p className="text-gray-500 mt-0.5 text-sm">
            {venues.length} venue{venues.length !== 1 ? 's' : ''} assigned · {bookings.length} total bookings
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Bookings" value={todayBookings.length} icon={CalendarDays} iconBg="bg-[#e6f3fc]" iconText="text-[#0078D7]" />
        <StatCard label="Pending Review"   value={pendingCount}         icon={Clock}         iconBg="bg-amber-50"  iconText="text-amber-600" />
        <StatCard label="Confirmed Today"  value={confirmedToday}       icon={CheckCircle2}  iconBg="bg-emerald-50" iconText="text-emerald-600" />
        <StatCard label="Cancelled Today"  value={cancelledToday}       icon={XCircle}       iconBg="bg-red-50"    iconText="text-red-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Pending approvals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Clock size={15} className="text-amber-500" /> Pending Approvals
              {pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">{pendingCount}</span>
              )}
            </h3>
            <button
              onClick={() => navigate('/organizer/bookings?status=Pending')}
              className="text-xs text-[#0078D7] hover:underline flex items-center gap-1 font-medium"
            >
              View all <ArrowRight size={11} />
            </button>
          </div>

          {recentPending.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400" />
              No pending approvals
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPending.map(b => (
                <div key={b.id} className="px-5 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{b.facilityName}</p>
                      <p className="text-xs text-gray-500">{b.userName} · {fmtDate(b.startTime)} {fmtTime(b.startTime)}</p>
                    </div>
                    <button
                      onClick={() => navigate('/organizer/bookings')}
                      className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded-xl flex-shrink-0 transition-colors font-medium"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming confirmed */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <CalendarDays size={15} className="text-[#0078D7]" /> Upcoming Bookings
            </h3>
            <button
              onClick={() => navigate('/organizer/schedule')}
              className="text-xs text-[#0078D7] hover:underline flex items-center gap-1 font-medium"
            >
              Schedule <ArrowRight size={11} />
            </button>
          </div>

          {upcoming.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              <CalendarDays size={24} className="mx-auto mb-2 opacity-30" />
              No upcoming bookings
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcoming.map(b => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-2 hover:bg-gray-50/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{b.facilityName}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Users size={10} /> {b.userName} · {fmtDate(b.startTime)} · {fmtTime(b.startTime)}–{fmtTime(b.endTime)}
                    </p>
                  </div>
                  <Badge label={b.status} color={bookingStatusColor(b.status)} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Venues */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Building2 size={15} className="text-[#0078D7]" /> My Venues
          </h3>
          <button
            onClick={() => navigate('/organizer/venue')}
            className="text-xs text-[#0078D7] hover:underline flex items-center gap-1 font-medium"
          >
            Manage <ArrowRight size={11} />
          </button>
        </div>

        {venues.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            <Building2 size={24} className="mx-auto mb-2 opacity-30" />
            No venues assigned yet
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {venues.map(v => (
              <div key={v.id} className="rounded-2xl border border-gray-100 p-4 hover:border-[#99cff3] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_-2px_rgb(0_0_0_/_0.08)] transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 bg-[#e6f3fc] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 size={15} className="text-[#0078D7]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{v.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                      <MapPin size={10} /> {v.communityName}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#0078D7] font-medium">{v.facilityCount} facilit{v.facilityCount === 1 ? 'y' : 'ies'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
