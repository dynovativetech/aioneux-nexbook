import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays, CheckCircle2, XCircle, Clock,
  Search, ChevronDown, Users,
} from 'lucide-react';
import { venueService } from '../../services/venueService';
import type { Booking, BookingStatus } from '../../types';
import Badge, { bookingStatusColor } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal, { ConfirmModal } from '../../components/ui/Modal';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      + ' Â· ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

// â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Toast({ ok, msg, onClose }: { ok: boolean; msg: string; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white
      ${ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">âœ•</button>
    </div>
  );
}

// â”€â”€ Booking Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BookingRow({ booking, onConfirm, onReject }: {
  booking: Booking;
  onConfirm: (b: Booking) => void;
  onReject:  (b: Booking) => void;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-xs text-gray-500">#{String(booking.id).padStart(4, '0')}</td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-800">{booking.facilityName}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Users size={10} /> {booking.userName}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-gray-700">{fmtDateTime(booking.startTime)}</p>
        <p className="text-xs text-gray-400">{fmtTime(booking.startTime)} â€“ {fmtTime(booking.endTime)}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-gray-700">{booking.activityName}</p>
        {booking.participantCount && booking.participantCount > 1 && (
          <p className="text-xs text-gray-400">{booking.participantCount} pax</p>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <Badge label={booking.status} color={bookingStatusColor(booking.status)} size="sm" />
      </td>
      <td className="px-4 py-3 text-right">
        {booking.status === 'Pending' && (
          <div className="inline-flex items-center gap-1.5">
            <button
              onClick={() => onConfirm(booking)}
              className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <CheckCircle2 size={12} /> Confirm
            </button>
            <button
              onClick={() => onReject(booking)}
              className="flex items-center gap-1 text-xs bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATUS_OPTIONS: { value: BookingStatus | ''; label: string }[] = [
  { value: '',            label: 'All Statuses' },
  { value: 'Pending',     label: 'Pending' },
  { value: 'Confirmed',   label: 'Confirmed' },
  { value: 'Cancelled',   label: 'Cancelled' },
  { value: 'Completed',   label: 'Completed' },
];

export default function OrgBookingsPage() {
  const [searchParams] = useSearchParams();
  const preStatus = (searchParams.get('status') ?? '') as BookingStatus | '';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);

  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>(preStatus);
  const [dateFilter,   setDateFilter]   = useState('');
  const [search,       setSearch]       = useState('');

  // Confirm / Reject
  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null);
  const [rejectTarget,  setRejectTarget]  = useState<Booking | null>(null);
  const [rejectReason,  setRejectReason]  = useState('');
  const [actioning,     setActioning]     = useState(false);

  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await venueService.getMyBookings({
        status: statusFilter || undefined,
        date:   dateFilter   || undefined,
      });
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      showToast(false, 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleConfirm() {
    if (!confirmTarget) return;
    setActioning(true);
    try {
      await venueService.confirmBooking(confirmTarget.id);
      showToast(true, `Booking #${confirmTarget.id} confirmed.`);
      setConfirmTarget(null);
      load();
    } catch {
      showToast(false, 'Failed to confirm booking.');
    } finally {
      setActioning(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setActioning(true);
    try {
      await venueService.rejectBooking(rejectTarget.id, rejectReason || 'Rejected by organizer.');
      showToast(true, `Booking #${rejectTarget.id} rejected.`);
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch {
      showToast(false, 'Failed to reject booking.');
    } finally {
      setActioning(false);
    }
  }

  // Client-side name search
  const filtered = search.trim()
    ? bookings.filter(b =>
        b.facilityName.toLowerCase().includes(search.toLowerCase()) ||
        b.userName.toLowerCase().includes(search.toLowerCase()) ||
        b.activityName.toLowerCase().includes(search.toLowerCase()))
    : bookings;

  const pendingCount = bookings.filter(b => b.status === 'Pending').length;

  return (
    <div className="w-[80%] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bookings</h2>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 flex items-center gap-1 mt-0.5">
              <Clock size={13} /> {pendingCount} booking{pendingCount > 1 ? 's' : ''} awaiting your approval
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
            placeholder="Search facility, customerâ€¦"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            className="appearance-none border border-gray-200 rounded-lg px-3 py-1.5 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as BookingStatus | '')}
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Date */}
        <input
          type="date"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />

        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear date
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? <Spinner fullPage /> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500">{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-gray-400 text-sm">No bookings found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Facility / Customer</th>
                    <th className="px-4 py-2 text-left">Date & Time</th>
                    <th className="px-4 py-2 text-left">Activity</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(b => (
                    <BookingRow
                      key={b.id}
                      booking={b}
                      onConfirm={setConfirmTarget}
                      onReject={b => { setRejectTarget(b); setRejectReason(''); }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={confirmTarget !== null}
        title="Confirm Booking"
        description={`Confirm booking #${confirmTarget?.id} for ${confirmTarget?.userName} at ${confirmTarget?.facilityName}? An email notification will be sent to the customer.`}
        confirmLabel="Confirm Booking"
        tone="success"
        loading={actioning}
        onConfirm={handleConfirm}
        onClose={() => setConfirmTarget(null)}
      />

      {/* Reject modal */}
      <Modal
        isOpen={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title="Reject Booking"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Reject booking <span className="font-medium">#{rejectTarget?.id}</span> for{' '}
            <span className="font-medium">{rejectTarget?.userName}</span>?
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Reason <span className="text-gray-400">(optional â€” sent to customer)</span>
            </label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
              placeholder="e.g. Facility not available on this dateâ€¦"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleReject} disabled={actioning}>
              {actioning ? 'Rejectingâ€¦' : 'Reject Booking'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stats quick bar at bottom */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['Pending', 'Confirmed', 'Cancelled', 'Completed'] as BookingStatus[]).map(s => {
          const count = bookings.filter(b => b.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
              className={`bg-white rounded-xl border px-4 py-3 text-sm text-left transition-all
                ${statusFilter === s ? 'border-[#0078D7] bg-[#e6f3fc]' : 'border-gray-200 hover:border-[#66b7ed]'}`}
            >
              <p className="text-xl font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-500">{s}</p>
            </button>
          );
        })}
      </div>

      {toast && <Toast ok={toast.ok} msg={toast.msg} onClose={() => setToast(null)} />}
    </div>
  );
}

