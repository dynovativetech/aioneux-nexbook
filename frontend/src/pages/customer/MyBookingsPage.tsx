import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CalendarPlus } from 'lucide-react';
import { useAuth }     from '../../context/AuthContext';
import { useBookings } from '../../hooks/useBookings';
import { bookingService } from '../../services/bookingService';
import Badge, { bookingStatusColor } from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import type { Booking, BookingStatus } from '../../types';

type Filter = 'All' | BookingStatus;
const FILTERS: Filter[] = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];
const PAGE_SIZES = [10, 15, 20, 25, 30, 40, 50];

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function daysUntilLabel(iso: string): { label: string; cls: string } {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (diff < 0)   return { label: 'Past',        cls: 'bg-gray-100 text-gray-500' };
  if (diff === 0) return { label: 'Today',       cls: 'bg-emerald-100 text-emerald-700' };
  if (diff === 1) return { label: 'Tomorrow',    cls: 'bg-[#e6f3fc] text-[#025DB6]' };
  return           { label: `In ${diff} days`,   cls: 'bg-[#e6f3fc] text-[#025DB6]' };
}

function BookingRow({ b, onCancel, cancelling }: {
  b: Booking;
  onCancel: (id: number) => void;
  cancelling: number | null;
}) {
  const { label, cls } = daysUntilLabel(b.startTime);
  const dt = new Date(b.startTime);

  return (
    <div className="flex items-stretch hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-0">

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
        <p className="text-[10px] text-gray-400 mt-0.5">#{b.id}</p>
      </div>

      {/* ── Col 3: Countdown + Status + Cancel ── */}
      <div className="flex-shrink-0 flex flex-col items-end justify-center gap-1.5 pr-4 pl-2 py-3">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>
          {label}
        </span>
        <Badge label={b.status} color={bookingStatusColor(b.status)} />
        {(b.status === 'Pending' || b.status === 'Confirmed') && (
          <Button variant="danger" size="sm"
            loading={cancelling === b.id}
            onClick={() => onCancel(b.id)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const { user }                   = useAuth();
  const { bookings, loading, refresh } = useBookings();
  const [filter, setFilter]        = useState<Filter>('All');
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [pageSize, setPageSize]     = useState(10);
  const [page, setPage]             = useState(1);

  const mine = bookings.filter((b) => b.userId === user?.id);
  const filtered = filter === 'All' ? mine : mine.filter((b) => b.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const shown = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  async function cancel(id: number) {
    setCancelling(id);
    try {
      await bookingService.cancel(id);
      refresh();
    } catch {
      alert('Failed to cancel booking.');
    } finally {
      setCancelling(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="w-[80%] mx-auto space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Bookings</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {mine.length} booking{mine.length !== 1 ? 's' : ''} in total
          </p>
        </div>
        <Link
          to="/book"
          className="flex items-center gap-2 bg-gradient-to-r from-[#0078D7] to-[#025DB6] hover:from-[#0087e0] hover:to-[#0169C9] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_-2px_rgb(0_120_215_/_0.40)] hover:-translate-y-0.5 transition-all duration-200"
        >
          <CalendarPlus size={15} /> New Booking
        </Link>
      </div>

      {/* Filter tabs + page size selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${filter === f
                  ? 'bg-[#0078D7] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f}
              {f !== 'All' && (
                <span className="ml-1 opacity-60 text-xs">
                  ({mine.filter((b) => b.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-xs whitespace-nowrap">Show</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 text-gray-700"
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} per page</option>)}
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] py-16 text-center text-gray-400">
          <Calendar size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bookings found</p>
          <p className="text-sm mt-1">Try a different filter or create a new booking.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
            {shown.map((b: Booking) => (
              <BookingRow key={b.id} b={b} onCancel={cancel} cancelling={cancelling} />
            ))}
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-gray-400">
                Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} bookings
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ‹ Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-gray-300 text-xs">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          safePage === p
                            ? 'bg-[#0078D7] text-white shadow-sm'
                            : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

