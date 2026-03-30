import { useState, useEffect } from 'react';
import { Search, Plus, CalendarDays } from 'lucide-react';
import { useBookings }    from '../../hooks/useBookings';
import { bookingService } from '../../services/bookingService';
import { venueService, type VenueListItem } from '../../services/venueService';
import { facilityService } from '../../services/facilityService';
import Badge, { bookingStatusColor } from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal   from '../../components/ui/Modal';
import type { Booking, BookingStatus, Facility } from '../../types';

type Filter = 'All' | BookingStatus;
const FILTERS: Filter[] = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const inputCls = `w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent`;

// â”€â”€ Create Booking Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CreateBookingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [venues,     setVenues]     = useState<VenueListItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [venueId,    setVenueId]    = useState<number | ''>('');
  const [facilityId, setFacilityId] = useState<number | ''>('');
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [startTime,  setStartTime]  = useState('09:00');
  const [endTime,    setEndTime]    = useState('10:00');
  const [notes,      setNotes]      = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [participants, setParticipants]   = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    venueService.list().then(setVenues).catch(() => {});
  }, []);

  useEffect(() => {
    if (!venueId) { setFacilities([]); setFacilityId(''); return; }
    facilityService.getAll({ venueId: Number(venueId) }).then(setFacilities).catch(() => {});
  }, [venueId]);

  async function submit() {
    if (!facilityId || !date || !startTime || !endTime) {
      setError('Facility, date, start time and end time are required.');
      return;
    }
    setSaving(true); setError('');
    try {
      const startDt = `${date}T${startTime}:00`;
      const endDt   = `${date}T${endTime}:00`;
      await bookingService.create({
        facilityId: Number(facilityId),
        startTime: startDt,
        endTime: endDt,
        participantCount: participants,
        notes: notes || undefined,
        customerEmail: customerEmail || undefined,
      } as any);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to create booking.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Create Booking" size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={submit}
            icon={<CalendarDays size={14} />}>
            Create Booking
          </Button>
        </div>
      }>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Venue</label>
          <select value={venueId} onChange={e => setVenueId(e.target.value ? Number(e.target.value) : '')}
            className={inputCls}>
            <option value="">Select venueâ€¦</option>
            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Facility <span className="text-red-500">*</span></label>
          <select value={facilityId} onChange={e => setFacilityId(e.target.value ? Number(e.target.value) : '')}
            disabled={!venueId} className={inputCls}>
            <option value="">Select facilityâ€¦</option>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Customer Email (optional)</label>
          <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
            placeholder="customer@example.com" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Time <span className="text-red-500">*</span></label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Time <span className="text-red-500">*</span></label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Participants</label>
          <input type="number" min={1} value={participants} onChange={e => setParticipants(Number(e.target.value))}
            className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Optional notesâ€¦" className={inputCls} />
        </div>
      </div>
    </Modal>
  );
}

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ManageBookingsPage() {
  const { bookings, loading, refresh } = useBookings();
  const [filter,     setFilter]     = useState<Filter>('All');
  const [search,     setSearch]     = useState('');
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [creating,   setCreating]   = useState(false);

  const filtered = bookings
    .filter((b) => filter === 'All' || b.status === filter)
    .filter((b) =>
      !search ||
      b.userName.toLowerCase().includes(search.toLowerCase()) ||
      b.facilityName.toLowerCase().includes(search.toLowerCase())
    );

  async function cancel(id: number) {
    if (!confirm('Cancel this booking?')) return;
    setCancelling(id);
    try { await bookingService.cancel(id); refresh(); }
    catch { alert('Failed to cancel.'); }
    finally { setCancelling(null); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user or facilityâ€¦"
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200
              focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 bg-white" />
        </div>
        <div className="flex gap-1.5 flex-wrap flex-1">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === f ? 'bg-[#0078D7] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={14}/>} onClick={() => setCreating(true)}>
          New Booking
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {FILTERS.map(f => {
          const count = f === 'All' ? bookings.length : bookings.filter(b => b.status === f).length;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-xl border p-3 text-center transition-all ${
                filter === f ? 'border-[#99cff3] bg-[#e6f3fc]' : 'border-gray-100 bg-white hover:border-[#0078D7]'
              }`}>
              <p className="text-xl font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-500">{f}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'Customer', 'Facility', 'Activity', 'Date & Time', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                  No bookings found.
                </td></tr>
              ) : filtered.map((b: Booking) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{b.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{b.userName}</td>
                  <td className="px-4 py-3 text-gray-600">{b.facilityName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{b.activityName ?? 'â€”'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{fmtDate(b.startTime)}</td>
                  <td className="px-4 py-3"><Badge label={b.status} color={bookingStatusColor(b.status)} /></td>
                  <td className="px-4 py-3">
                    {(b.status === 'Pending' || b.status === 'Confirmed') && (
                      <Button variant="danger" size="sm"
                        loading={cancelling === b.id}
                        onClick={() => cancel(b.id)}>
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {creating && (
        <CreateBookingModal
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); refresh(); }}
        />
      )}
    </div>
  );
}

