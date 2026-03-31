import { useState, useEffect } from 'react';
import { CalendarPlus, SlidersHorizontal, X, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBookings }    from '../../hooks/useBookings';
import { bookingService } from '../../services/bookingService';
import { venueService, type VenueListItem } from '../../services/venueService';
import { facilityService } from '../../services/facilityService';
import Badge, { bookingStatusColor } from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal   from '../../components/ui/Modal';
import type { Booking, BookingStatus, Facility } from '../../types';

// ── Constants ───────────────────────────────────────────────────────────────

type Filter = 'All' | BookingStatus;
const FILTERS: Filter[] = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];
const ALL_STATUSES: BookingStatus[] = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
const PAGE_SIZES = [10, 15, 20, 25, 30, 40, 50];

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const inputCls = `w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent bg-white`;

// ── Compact booking row (member portal style) ────────────────────────────────

function AdminBookingRow({ b, onEdit }: { b: Booking; onEdit: (b: Booking) => void }) {
  const { label, cls } = daysUntilLabel(b.startTime);
  const dt = new Date(b.startTime);
  return (
    <div className="flex items-stretch hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-0 group">
      {/* Date block */}
      <div className="flex-shrink-0 w-[60px] flex flex-col items-center justify-center bg-gradient-to-b from-[#e8f3fd] to-[#daeefb] border-r border-[#c5def6] py-3 gap-0">
        <span className="text-[9px] font-extrabold text-[#0078D7] uppercase tracking-widest leading-none">
          {dt.toLocaleDateString('en-GB', { month: 'short' })}
        </span>
        <span className="text-[26px] font-black text-[#025DB6] leading-tight">{dt.getDate()}</span>
        <span className="text-[9px] font-semibold text-[#0078D7]/70 uppercase tracking-wider leading-none">
          {dt.toLocaleDateString('en-GB', { weekday: 'short' })}
        </span>
      </div>

      {/* Main content */}
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

      {/* Right: countdown + status + edit */}
      <div className="flex-shrink-0 flex flex-col items-end justify-center gap-1.5 pr-4 pl-2 py-2.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{label}</span>
        <Badge label={b.status} color={bookingStatusColor(b.status)} />
        <button onClick={() => onEdit(b)}
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#0078D7] transition-colors">
          <Pencil size={11} /> Edit
        </button>
      </div>
    </div>
  );
}

// ── Create Booking Modal ──────────────────────────────────────────────────────

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

  useEffect(() => { venueService.list().then(setVenues).catch(() => {}); }, []);
  useEffect(() => {
    if (!venueId) { setFacilities([]); setFacilityId(''); return; }
    facilityService.getAll({ venueId: Number(venueId) }).then(setFacilities).catch(() => {});
  }, [venueId]);

  async function submit() {
    if (!facilityId || !date || !startTime || !endTime) {
      setError('Facility, date, start time and end time are required.'); return;
    }
    setSaving(true); setError('');
    try {
      await bookingService.create({
        facilityId: Number(facilityId),
        startTime: `${date}T${startTime}:00`,
        endTime: `${date}T${endTime}:00`,
        participantCount: participants,
        notes: notes || undefined,
        customerEmail: customerEmail || undefined,
      } as any);
      onCreated(); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to create booking.');
    } finally { setSaving(false); }
  }

  return (
    <Modal isOpen onClose={onClose} title="Create Booking" size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={submit} icon={<CalendarPlus size={14}/>}>
            Create Booking
          </Button>
        </div>
      }>
      <div className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Venue</label>
          <select value={venueId} onChange={e => setVenueId(e.target.value ? Number(e.target.value) : '')} className={inputCls}>
            <option value="">Select venue...</option>
            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Facility <span className="text-red-500">*</span></label>
          <select value={facilityId} onChange={e => setFacilityId(e.target.value ? Number(e.target.value) : '')}
            disabled={!venueId} className={inputCls}>
            <option value="">Select facility...</option>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Customer Email</label>
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
          <input type="number" min={1} value={participants} onChange={e => setParticipants(Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Optional notes..." className={inputCls} />
        </div>
      </div>
    </Modal>
  );
}

// ── Edit Booking Modal ────────────────────────────────────────────────────────

function EditBookingModal({ booking, onClose, onSaved }: {
  booking: Booking; onClose: () => void; onSaved: () => void;
}) {
  const startDt = new Date(booking.startTime);
  const endDt   = new Date(booking.endTime);

  const [date,      setDate]      = useState(startDt.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(`${String(startDt.getHours()).padStart(2,'0')}:${String(startDt.getMinutes()).padStart(2,'0')}`);
  const [endTime,   setEndTime]   = useState(`${String(endDt.getHours()).padStart(2,'0')}:${String(endDt.getMinutes()).padStart(2,'0')}`);
  const [status,    setStatus]    = useState<BookingStatus>(booking.status as BookingStatus);
  const [notes,     setNotes]     = useState(booking.notes ?? '');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  async function save() {
    if (!date || !startTime || !endTime) { setError('Date and times are required.'); return; }
    setSaving(true); setError('');
    try {
      await bookingService.update(booking.id, {
        facilityId: booking.facilityId,
        startTime: `${date}T${startTime}:00`,
        endTime:   `${date}T${endTime}:00`,
        status,
        notes: notes || undefined,
      } as any);
      onSaved(); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to update booking.');
    } finally { setSaving(false); }
  }

  return (
    <Modal isOpen onClose={onClose} title={`Edit Booking #${booking.id}`} size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save} icon={<Pencil size={14}/>}>
            Save Changes
          </Button>
        </div>
      }>
      <div className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        {/* Booking summary */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-sm">
          <p className="font-medium text-gray-800">{booking.facilityName}</p>
          {booking.venueName && <p className="text-xs text-gray-500 mt-0.5">{booking.venueName}</p>}
          <p className="text-xs text-gray-400 mt-1">Customer: <span className="font-medium text-gray-600">{booking.userName}</span></p>
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  status === s
                    ? s === 'Confirmed' ? 'bg-emerald-500 text-white border-emerald-500'
                    : s === 'Pending'   ? 'bg-amber-500  text-white border-amber-500'
                    : s === 'Completed' ? 'bg-[#0078D7]  text-white border-[#0078D7]'
                                        : 'bg-red-500    text-white border-red-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Admin notes..." className={inputCls} />
        </div>
      </div>
    </Modal>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ManageBookingsPage() {
  const { bookings, loading, refresh } = useBookings();
  const [filter,      setFilter]      = useState<Filter>('All');
  const [search,      setSearch]      = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pageSize,    setPageSize]    = useState(10);
  const [page,        setPage]        = useState(1);
  const [creating,    setCreating]    = useState(false);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);

  const filtered = bookings
    .filter(b => filter === 'All' || b.status === filter)
    .filter(b => {
      if (!search) return true;
      const q = search.toLowerCase();
      return b.userName.toLowerCase().includes(q) || b.facilityName.toLowerCase().includes(q);
    })
    .filter(b => {
      if (!venueFilter) return true;
      return b.facilityName.toLowerCase().includes(venueFilter.toLowerCase()) ||
             (b.venueName ?? '').toLowerCase().includes(venueFilter.toLowerCase());
    })
    .filter(b => {
      const d = new Date(b.startTime);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });

  const activeFilters = [search, venueFilter, dateFrom, dateTo].filter(Boolean).length;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function clearFilters() { setSearch(''); setVenueFilter(''); setDateFrom(''); setDateTo(''); }
  function resetPage()    { setPage(1); }

  if (loading) return <Spinner />;

  return (
    <div className="w-[80%] mx-auto space-y-5">

      {/* Header toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{bookings.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
              filtersOpen || activeFilters > 0
                ? 'bg-[#e6f3fc] border-[#99cff3] text-[#0078D7]'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <SlidersHorizontal size={14} />
            Filters
            {activeFilters > 0 && (
              <span className="bg-[#0078D7] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
          <Button variant="primary" size="sm" icon={<CalendarPlus size={14}/>} onClick={() => setCreating(true)}>
            New Booking
          </Button>
        </div>
      </div>

      {/* Status summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {FILTERS.map(f => {
          const count = f === 'All' ? bookings.length : bookings.filter(b => b.status === f).length;
          return (
            <button key={f} onClick={() => { setFilter(f); resetPage(); }}
              className={`rounded-xl border p-3 text-center transition-all ${
                filter === f ? 'border-[#99cff3] bg-[#e6f3fc]' : 'border-gray-100 bg-white hover:border-[#0078D7]'
              }`}>
              <p className="text-xl font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-500">{f}</p>
            </button>
          );
        })}
      </div>

      {/* Expandable filter panel */}
      {filtersOpen && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Search customer / facility</label>
              <input value={search} onChange={e => { setSearch(e.target.value); resetPage(); }}
                placeholder="Name, email or facility..." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Venue</label>
              <input value={venueFilter} onChange={e => { setVenueFilter(e.target.value); resetPage(); }}
                placeholder="Venue name..." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); resetPage(); }} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); resetPage(); }} className={inputCls} />
            </div>
          </div>
          {activeFilters > 0 && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] py-16 text-center">
          <p className="text-gray-400 text-sm">No bookings found.</p>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="mt-2 text-xs text-[#0078D7] hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
            {/* List header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
                {filtered.length < bookings.length && (
                  <span className="text-gray-400 font-normal"> of {bookings.length} total</span>
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Show</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); resetPage(); }}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#0078D7]/30">
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span>per page</span>
              </div>
            </div>

            {paged.map(b => (
              <AdminBookingRow key={b.id} b={b} onEdit={setEditBooking} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-gray-400">
                Page {page} of {totalPages} ({filtered.length} results)
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 disabled:opacity-40">
                  «
                </button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const pg = start + i;
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        pg === page ? 'bg-[#0078D7] text-white border-[#0078D7]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronRight size={13} />
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 disabled:opacity-40">
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {creating && (
        <CreateBookingModal
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); refresh(); }}
        />
      )}

      {editBooking && (
        <EditBookingModal
          booking={editBooking}
          onClose={() => setEditBooking(null)}
          onSaved={() => { setEditBooking(null); refresh(); }}
        />
      )}
    </div>
  );
}
