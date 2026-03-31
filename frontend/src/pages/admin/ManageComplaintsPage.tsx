import { useEffect, useState, useRef, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquareWarning, Send, Paperclip, X, ImageIcon,
  ShieldCheck, Bot, ChevronRight, Tag, Hash, MessageCircle,
  CalendarDays, Search, SlidersHorizontal, User2, CheckCircle2,
} from 'lucide-react';
import { useAuth }                     from '../../context/AuthContext';
import { complaintService }            from '../../services/complaintService';
import Badge, { complaintStatusColor } from '../../components/ui/Badge';
import Button                          from '../../components/ui/Button';
import Spinner                         from '../../components/ui/Spinner';
import type { Complaint, ComplaintStatus } from '../../types';

// ── helpers ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: 'Open',             label: 'Open'               },
  { value: 'InProgress',       label: 'In Progress'        },
  { value: 'ActionRequired',   label: 'Action Required'    },
  { value: 'MoreInfoRequired', label: 'More Info Required'  },
  { value: 'Resolved',         label: 'Resolved'           },
  { value: 'Rejected',         label: 'Rejected'           },
  { value: 'Closed',           label: 'Closed'             },
  { value: 'Cancelled',        label: 'Cancelled'          },
];

const FILTER_STATUSES: { value: ComplaintStatus | 'All'; label: string }[] = [
  { value: 'All',             label: 'All'              },
  ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
];

const STATUS_STRIPE: Record<string, string> = {
  Open:             'bg-amber-400',
  InProgress:       'bg-[#0078D7]',
  Resolved:         'bg-emerald-500',
  Cancelled:        'bg-gray-300',
  Closed:           'bg-gray-400',
  ActionRequired:   'bg-red-400',
  MoreInfoRequired: 'bg-orange-400',
  Rejected:         'bg-red-500',
};
const stripe = (s: string) => STATUS_STRIPE[s] ?? 'bg-gray-300';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

// ══════════════════════════════════════════════════════════════════════════
// Admin Complaint Detail Modal
// ══════════════════════════════════════════════════════════════════════════
function AdminComplaintModal({
  complaint,
  onClose,
  onUpdated,
}: {
  complaint: Complaint;
  onClose: () => void;
  onUpdated: (updated: Complaint) => void;
}) {
  const { user } = useAuth();

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [commentImg,  setCommentImg]  = useState<File | undefined>();
  const [sending,     setSending]     = useState(false);
  const fileRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Status update state
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>(complaint.status);
  const [adminNote,      setAdminNote]      = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMsg,      setStatusMsg]      = useState('');

  const canComment = !['Closed', 'Cancelled'].includes(complaint.status);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  async function handleStatusUpdate(e: FormEvent) {
    e.preventDefault();
    if (selectedStatus === complaint.status) return;
    setUpdatingStatus(true);
    try {
      const res = await complaintService.updateStatus(
        complaint.id, selectedStatus, adminNote.trim() || undefined, user?.id);
      if (res.success && res.data) {
        onUpdated(res.data);
        setAdminNote('');
        setStatusMsg('Status updated successfully.');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function sendComment() {
    if (!user || !commentText.trim()) return;
    setSending(true);
    try {
      const res = await complaintService.addComment(
        complaint.id, user.id, commentText.trim(), true, commentImg);
      if (res.success && res.data) {
        onUpdated({ ...complaint, comments: [...complaint.comments, res.data] });
        setCommentText('');
        setCommentImg(undefined);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    } finally {
      setSending(false);
    }
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        style={{ touchAction: 'none' }}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-3xl bg-white
          rounded-t-3xl sm:rounded-2xl
          shadow-[0_24px_64px_-8px_rgb(0_0_0_/_0.22)]
          flex flex-col
          h-[95svh] sm:h-[90vh] sm:max-h-[780px]
          overflow-hidden"
        style={{ animation: 'adminModalSlideUp 0.3s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />

          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-2 h-10 rounded-full flex-shrink-0 ${stripe(complaint.status)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                Complaint #{complaint.id} · By {complaint.userName}
              </p>
              <h2 className="text-base font-bold text-gray-900 leading-snug">{complaint.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200
                flex items-center justify-center text-gray-500 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2 mt-3 ml-5">
            <Badge label={complaint.status} color={complaintStatusColor(complaint.status)} />
            {complaint.category && (
              <span className="flex items-center gap-1 text-xs bg-[#e6f3fc] text-[#0078D7] font-medium px-2 py-0.5 rounded-full">
                <Tag size={10} /> {complaint.category}
              </span>
            )}
            {complaint.bookingId && (
              <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                <Hash size={10} /> Booking #{complaint.bookingId}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <CalendarDays size={10} /> {fmtDate(complaint.createdAt)}
            </span>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div
          className="flex-1 overflow-y-scroll overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {/* Description */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{complaint.description}</p>
          </div>

          {/* Attachments */}
          {complaint.imageUrls?.length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {complaint.imageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`attachment-${i + 1}`}
                      className="h-20 w-20 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Admin status update panel ── */}
          <div className="mx-5 mb-4 bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-[#0078D7]" /> Staff — Update Status
            </p>

            {statusMsg && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
                <CheckCircle2 size={13} /> {statusMsg}
              </div>
            )}

            <form onSubmit={handleStatusUpdate} className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800
                    focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7] bg-white flex-1 min-w-0"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <Button
                  type="submit"
                  size="sm"
                  loading={updatingStatus}
                  disabled={selectedStatus === complaint.status}
                >
                  Update Status
                </Button>
              </div>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Optional note visible to the customer explaining the status change…"
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800
                  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25
                  focus:border-[#0078D7] resize-none"
              />
            </form>
          </div>

          {/* Communication thread */}
          <div className="mx-5 border-t border-gray-100 mb-1" />
          <div className="px-5 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <MessageCircle size={11} />
              Communication Thread
              <span className="ml-1 bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {complaint.comments.length}
              </span>
            </p>
          </div>

          <div className="px-5 pb-4 space-y-3">
            {complaint.comments.length === 0 && (
              <p className="text-xs text-gray-400 italic">No messages yet.</p>
            )}
            {complaint.comments.map((cm) => {
              const isAdmin  = cm.isAdminComment && !cm.isSystemComment;
              const isSystem = cm.isSystemComment;
              return (
                <div key={cm.id} className={`flex gap-2.5 ${isAdmin || isSystem ? '' : 'flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold
                    ${isSystem ? 'bg-amber-400' : isAdmin ? 'bg-[#0078D7]' : 'bg-gray-400'}`}>
                    {isSystem ? <Bot size={13} /> : isAdmin ? <ShieldCheck size={12} /> : (cm.authorName?.[0] ?? 'U')}
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                    isSystem ? 'bg-amber-50 border border-amber-100 rounded-tl-sm' :
                    isAdmin  ? 'bg-[#e6f3fc] border border-[#c5def6] rounded-tl-sm' :
                               'bg-gray-100 border border-gray-200 rounded-tr-sm'
                  }`}>
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[11px] font-semibold ${
                        isSystem ? 'text-amber-700' : isAdmin ? 'text-[#025DB6]' : 'text-gray-700'
                      }`}>
                        {isSystem ? 'System' : cm.authorName}
                        {isAdmin && <span className="ml-1 text-[9px] font-normal opacity-70">(Staff)</span>}
                      </span>
                      <span className="text-[10px] text-gray-400">{fmtDateTime(cm.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{cm.text}</p>
                    {cm.imageUrl && (
                      <a href={cm.imageUrl} target="_blank" rel="noreferrer" className="mt-2 block">
                        <img src={cm.imageUrl} alt="attachment"
                          className="h-28 rounded-xl border border-gray-200 object-cover hover:opacity-80 transition-opacity" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Pinned comment footer (admin reply) ── */}
        {canComment ? (
          <div
            className="flex-shrink-0 border-t border-gray-100 px-4 py-3 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {commentImg && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 mb-2">
                <ImageIcon size={12} className="text-[#0078D7]" />
                <span className="text-xs text-gray-600 flex-1 truncate">{commentImg.name}</span>
                <button onClick={() => setCommentImg(undefined)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 w-9 h-9 rounded-xl border border-gray-200 hover:border-[#0078D7]
                  hover:bg-[#e6f3fc] text-gray-400 hover:text-[#0078D7] flex items-center justify-center transition-colors"
              >
                <Paperclip size={15} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setCommentImg(e.target.files?.[0]);
                  if (e.target) e.target.value = '';
                }} />
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                placeholder="Write a staff reply…"
                className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7]"
              />
              <Button size="sm" icon={<Send size={13} />} loading={sending} onClick={sendComment}>
                Reply
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-3 bg-gray-50 text-center">
            <p className="text-xs text-gray-400">
              This complaint is {complaint.status.toLowerCase()} — no further replies can be added.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes adminModalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
}

// ══════════════════════════════════════════════════════════════════════════
// Admin Complaint Row (compact, same style as customer portal)
// ══════════════════════════════════════════════════════════════════════════
function AdminComplaintRow({ c, onClick }: { c: Complaint; onClick: () => void }) {
  const dt = new Date(c.createdAt);
  const dateStr = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center hover:bg-blue-50/30 transition-colors
        border-b border-gray-100 last:border-0 text-left group"
    >
      {/* Status stripe */}
      <div className={`flex-shrink-0 w-1 self-stretch ${stripe(c.status)}`} />

      {/* Main content */}
      <div className="flex-1 min-w-0 px-4 py-2.5 flex flex-col gap-0.5">
        {/* Title */}
        <p className="text-sm font-bold text-gray-800 truncate leading-snug">{c.title}</p>
        {/* Meta row */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-wrap">
          <span className="flex items-center gap-0.5 text-gray-500 font-medium">
            <User2 size={9} />{c.userName}
          </span>
          <span className="text-gray-200">·</span>
          {c.category && (
            <>
              <span className="flex items-center gap-0.5 text-[#0078D7] font-semibold">
                <Tag size={9} />{c.category}
              </span>
              <span className="text-gray-200">·</span>
            </>
          )}
          <span>{dateStr}</span>
          <span className="text-gray-300">·</span>
          <span className="tabular-nums">{timeStr}</span>
          {c.bookingId && (
            <>
              <span className="text-gray-200">·</span>
              <span className="flex items-center gap-0.5"><Hash size={9} />#{c.bookingId}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: status + msgs */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1 px-3 py-2.5">
        <Badge label={c.status} color={complaintStatusColor(c.status)} />
        <span className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
          <MessageCircle size={10} />
          {c.comments.length} msg{c.comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 pr-3 text-gray-300 group-hover:text-[#0078D7] transition-colors">
        <ChevronRight size={15} />
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════
export default function ManageComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]  = useState<Complaint | null>(null);

  // Filters
  const [showFilters,    setShowFilters]    = useState(false);
  const [filterSearch,   setFilterSearch]   = useState('');
  const [filterStatus,   setFilterStatus]   = useState<ComplaintStatus | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo,   setFilterDateTo]   = useState('');
  const [filterUser,     setFilterUser]     = useState('');

  // Pagination
  const PAGE_SIZES = [10, 15, 20, 25, 30] as const;
  const [pageSize, setPageSize] = useState<number>(10);
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    complaintService.getAll()
      .then((r) => setComplaints(r.success ? (r.data ?? []) : []))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived (all before early return) ────────────────────────────────────
  const activeFilterCount = [
    filterStatus !== 'All' ? filterStatus : '',
    filterCategory, filterDateFrom, filterDateTo, filterSearch, filterUser,
  ].filter(Boolean).length;

  const categoryOptions = useMemo(() =>
    [...new Set(complaints.map((c) => c.category).filter(Boolean))].sort() as string[],
    [complaints]);
  const userOptions = useMemo(() =>
    [...new Set(complaints.map((c) => c.userName))].sort(),
    [complaints]);

  const filtered = useMemo(() => complaints.filter((c) => {
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    if (filterCategory && c.category !== filterCategory)      return false;
    if (filterUser     && c.userName !== filterUser)          return false;
    const q = filterSearch.toLowerCase();
    if (q && !c.title.toLowerCase().includes(q)
          && !c.userName.toLowerCase().includes(q)
          && !String(c.id).includes(q)) return false;
    if (filterDateFrom) {
      const from = new Date(filterDateFrom); from.setHours(0,0,0,0);
      if (new Date(c.createdAt) < from) return false;
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo); to.setHours(23,59,59,999);
      if (new Date(c.createdAt) > to) return false;
    }
    return true;
  }), [complaints, filterStatus, filterCategory, filterUser, filterSearch, filterDateFrom, filterDateTo]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged      = filtered.slice((page - 1) * pageSize, page * pageSize);

  const counts = useMemo(() => complaints.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>), [complaints]);

  // Keep selected fresh after updates
  const freshSelected = selected
    ? (complaints.find((c) => c.id === selected.id) ?? selected)
    : null;

  function clearFilters() {
    setFilterSearch(''); setFilterStatus('All'); setFilterCategory('');
    setFilterDateFrom(''); setFilterDateTo(''); setFilterUser(''); setPage(1);
  }

  function handleUpdated(updated: Complaint) {
    setComplaints((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    setSelected(updated);
  }

  if (loading) return <Spinner />;

  return (
    <div className="w-[80%] mx-auto space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Complaint Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">{complaints.length} total complaints</p>
        </div>

        {/* Quick-status summary badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { s: 'Open'          as ComplaintStatus, label: 'Open',        cls: 'bg-blue-50 text-blue-700 border-blue-100'       },
            { s: 'InProgress'    as ComplaintStatus, label: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-100'     },
            { s: 'ActionRequired'as ComplaintStatus, label: 'Action Req',  cls: 'bg-orange-50 text-orange-700 border-orange-100'  },
            { s: 'Resolved'      as ComplaintStatus, label: 'Resolved',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-100'},
          ].map(({ s, label, cls }) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(f => f === s ? 'All' : s); setPage(1); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${cls} ${
                filterStatus === s ? 'ring-2 ring-offset-1 ring-current/30' : 'opacity-80 hover:opacity-100'
              }`}
            >
              {label}: {counts[s] ?? 0}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
              placeholder="Search by title, member name, or ID…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold
              transition-colors whitespace-nowrap ${
              showFilters || activeFilterCount > 0
                ? 'bg-[#e6f3fc] border-[#0078D7] text-[#0078D7]'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-[#0078D7] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap">
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="border-t border-gray-100 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Status</label>
              <select value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value as ComplaintStatus | 'All'); setPage(1); }}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-700
                  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] bg-white">
                <option value="All">All Statuses</option>
                {FILTER_STATUSES.filter((s) => s.value !== 'All').map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Category</label>
              <select value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-700
                  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] bg-white">
                <option value="">All Categories</option>
                {categoryOptions.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Member</label>
              <select value={filterUser}
                onChange={(e) => { setFilterUser(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-700
                  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] bg-white">
                <option value="">All Members</option>
                {userOptions.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">From Date</label>
              <input type="date" value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-700
                  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7]" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">To Date</label>
              <input type="date" value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-700
                  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7]" />
            </div>
          </div>
        )}
      </div>

      {/* Count + page-size */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-400">
          {filtered.length < complaints.length
            ? <><span className="font-semibold text-[#0078D7]">{filtered.length}</span> of {complaints.length} match</>
            : <>Showing <span className="font-semibold text-gray-600">{Math.min((page-1)*pageSize+1, filtered.length)}–{Math.min(page*pageSize, filtered.length)}</span> of <span className="font-semibold text-gray-600">{complaints.length}</span></>
          }
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">Show</span>
          <select value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700
              focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7] bg-white">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} per page</option>)}
          </select>
        </div>
      </div>

      {/* ── List ── */}
      {paged.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]
          py-14 flex flex-col items-center gap-3 text-center">
          <MessageSquareWarning size={28} className="text-gray-200" />
          <p className="text-sm text-gray-500">
            {activeFilterCount > 0 ? 'No complaints match your filters.' : 'No complaints yet.'}
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-[#0078D7] hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
            {/* Header row */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Complaint</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pr-8">Status</span>
            </div>
            {paged.map((c) => (
              <AdminComplaintRow key={c.id} c={c} onClick={() => setSelected(c)} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600
                  hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | '…')[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === '…' ? (
                    <span key={`e-${i}`} className="px-2 text-gray-400 text-xs">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        page === n
                          ? 'bg-[#0078D7] text-white border-[#0078D7] shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600
                  hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Detail modal ── */}
      {freshSelected && (
        <AdminComplaintModal
          complaint={freshSelected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
