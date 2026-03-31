import { useEffect, useState, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquareWarning, Send, Paperclip, X, ImageIcon,
  Plus, ShieldCheck, Bot, ChevronRight, Tag,
  Hash, MessageCircle, CalendarDays, Search, SlidersHorizontal,
  CheckCircle2, XCircle, Lock, AlertTriangle,
} from 'lucide-react';
import { useAuth }            from '../../context/AuthContext';
import { useBookings }        from '../../hooks/useBookings';
import { complaintService }   from '../../services/complaintService';
import {
  complaintCategoryService,
  FALLBACK_CATEGORIES,
}                             from '../../services/complaintCategoryService';
import Badge, { complaintStatusColor } from '../../components/ui/Badge';
import Button                 from '../../components/ui/Button';
import Input                  from '../../components/ui/Input';
import Spinner                from '../../components/ui/Spinner';
import type { Complaint, ComplaintCategory, ComplaintComment } from '../../types';

// ── helpers ───────────────────────────────────────────────────────────────
const BOOKING_KEYWORDS = ['booking', 'reservation'];
const requiresBooking  = (name: string) =>
  BOOKING_KEYWORDS.some((kw) => name.toLowerCase().includes(kw));

const toUrl = (p: string) => p;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

// ── status colour stripe ───────────────────────────────────────────────────
const STATUS_STRIPE: Record<string, string> = {
  Open:              'bg-amber-400',
  InProgress:        'bg-[#0078D7]',
  Resolved:          'bg-emerald-500',
  Cancelled:         'bg-gray-300',
  Closed:            'bg-gray-400',
  ActionRequired:    'bg-red-400',
  MoreInfoRequired:  'bg-orange-400',
  Rejected:          'bg-red-500',
};
const stripe = (s: string) => STATUS_STRIPE[s] ?? 'bg-gray-300';

// ══════════════════════════════════════════════════════════════════════════
// Complaint Detail Modal
// ══════════════════════════════════════════════════════════════════════════
// Customer-allowed status actions: which transitions are available per current status
const CUSTOMER_ACTIONS: Record<string, { status: string; label: string; icon: React.ReactNode; confirmLabel: string; btnCls: string }[]> = {
  Open:              [
    { status: 'Cancelled', label: 'Cancel Complaint',  confirmLabel: 'Yes, cancel it',  icon: <XCircle size={13} />,      btnCls: 'text-red-600 border-red-200 hover:bg-red-50' },
    { status: 'Resolved',  label: 'Mark as Resolved',  confirmLabel: 'Yes, mark resolved', icon: <CheckCircle2 size={13} />, btnCls: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' },
  ],
  InProgress:        [
    { status: 'Cancelled', label: 'Cancel Complaint',  confirmLabel: 'Yes, cancel it',  icon: <XCircle size={13} />,      btnCls: 'text-red-600 border-red-200 hover:bg-red-50' },
    { status: 'Resolved',  label: 'Mark as Resolved',  confirmLabel: 'Yes, mark resolved', icon: <CheckCircle2 size={13} />, btnCls: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' },
  ],
  ActionRequired:    [
    { status: 'Resolved',  label: 'Mark as Resolved',  confirmLabel: 'Yes, mark resolved', icon: <CheckCircle2 size={13} />, btnCls: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' },
    { status: 'Cancelled', label: 'Cancel Complaint',  confirmLabel: 'Yes, cancel it',  icon: <XCircle size={13} />,      btnCls: 'text-red-600 border-red-200 hover:bg-red-50' },
  ],
  MoreInfoRequired:  [
    { status: 'Resolved',  label: 'Mark as Resolved',  confirmLabel: 'Yes, mark resolved', icon: <CheckCircle2 size={13} />, btnCls: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' },
    { status: 'Cancelled', label: 'Cancel Complaint',  confirmLabel: 'Yes, cancel it',  icon: <XCircle size={13} />,      btnCls: 'text-red-600 border-red-200 hover:bg-red-50' },
  ],
  Resolved:          [
    { status: 'Closed',    label: 'Close Complaint',   confirmLabel: 'Yes, close it',   icon: <Lock size={13} />,         btnCls: 'text-gray-600 border-gray-200 hover:bg-gray-50' },
  ],
};

function ComplaintDetailModal({
  complaint,
  onClose,
  onCommentAdded,
  onStatusChanged,
}: {
  complaint: Complaint;
  onClose: () => void;
  onCommentAdded: (id: number, cm: ComplaintComment) => void;
  onStatusChanged: (id: number, newStatus: string) => void;
}) {
  const { user }    = useAuth();
  const [text, setText]   = useState('');
  const [img,  setImg]    = useState<File | undefined>();
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const canComment = !['Resolved', 'Rejected', 'Closed', 'Cancelled'].includes(complaint.status);

  // Customer status change
  const [confirmAction, setConfirmAction] = useState<string | null>(null); // status value pending confirm
  const [changingStatus, setChangingStatus] = useState(false);
  const customerActions = CUSTOMER_ACTIONS[complaint.status] ?? [];

  async function handleStatusChange(newStatus: string) {
    if (!user) return;
    setChangingStatus(true);
    try {
      const res = await complaintService.updateStatus(complaint.id, newStatus as never, undefined, user.id);
      if (res.success) {
        onStatusChanged(complaint.id, newStatus);
        setConfirmAction(null);
      }
    } finally {
      setChangingStatus(false);
    }
  }

  // scroll to latest comment on open
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, []);

  async function sendComment(e?: FormEvent) {
    e?.preventDefault();
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      const res = await complaintService.addComment(complaint.id, user.id, text.trim(), false, img);
      if (res.success && res.data) {
        onCommentAdded(complaint.id, res.data);
        setText('');
        setImg(undefined);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    } finally {
      setSending(false);
    }
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop — pointer-events only, panel stops propagation */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        style={{ touchAction: 'none' }}
      />

      {/* Panel — full screen on mobile, constrained on desktop */}
      <div
        className="relative z-10 w-full sm:max-w-2xl bg-white
          rounded-t-3xl sm:rounded-2xl
          shadow-[0_24px_64px_-8px_rgb(0_0_0_/_0.22)]
          flex flex-col
          h-[92svh] sm:h-[88vh] sm:max-h-[700px]
          overflow-hidden"
        style={{ animation: 'modalSlideUp 0.3s ease' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Modal header ── */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-gray-100">
          {/* Drag handle on mobile */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />

          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-2 h-10 rounded-full flex-shrink-0 ${stripe(complaint.status)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                Complaint #{complaint.id}
              </p>
              <h2 className="text-base font-bold text-gray-900 leading-snug">
                {complaint.title}
              </h2>
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
                <Hash size={10} /> Booking {complaint.bookingId}
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
                  <a key={i} href={toUrl(url)} target="_blank" rel="noreferrer">
                    <img
                      src={toUrl(url)}
                      alt={`attachment-${i + 1}`}
                      className="h-20 w-20 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments divider */}
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

          {/* Comment list */}
          <div className="px-5 pb-3 space-y-3">
            {complaint.comments.length === 0 && (
              <p className="text-xs text-gray-400 italic pb-2">No messages yet. Start the conversation below.</p>
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
                      <a href={toUrl(cm.imageUrl)} target="_blank" rel="noreferrer" className="mt-2 block">
                        <img src={toUrl(cm.imageUrl)} alt="attachment"
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

        {/* ── Customer status actions ── */}
        {customerActions.length > 0 && (
          <div
            className="flex-shrink-0 border-t border-gray-100 bg-gray-50/70 px-4 py-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmAction ? (
              /* Confirmation row */
              <div className="flex items-center gap-2 flex-wrap">
                <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                <span className="text-xs text-gray-600 flex-1 min-w-0">
                  {customerActions.find((a) => a.status === confirmAction)?.confirmLabel.replace('Yes, ', 'Are you sure you want to ')}?
                </span>
                <button
                  onClick={() => handleStatusChange(confirmAction)}
                  disabled={changingStatus}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0078D7] text-white
                    hover:bg-[#025DB6] disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {changingStatus ? 'Updating…' : customerActions.find((a) => a.status === confirmAction)?.confirmLabel}
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={changingStatus}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200
                    text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  No, keep it
                </button>
              </div>
            ) : (
              /* Action buttons */
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">Your actions:</span>
                {customerActions.map((action) => (
                  <button
                    key={action.status}
                    onClick={() => setConfirmAction(action.status)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg
                      border transition-colors ${action.btnCls}`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Pinned comment input footer ── */}
        {canComment && (
          <div
            className="flex-shrink-0 border-t border-gray-100 px-4 py-3 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {img && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 mb-2">
                <ImageIcon size={12} className="text-[#0078D7]" />
                <span className="text-xs text-gray-600 flex-1 truncate">{img.name}</span>
                <button onClick={() => setImg(undefined)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}
            <form onSubmit={sendComment} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 w-9 h-9 rounded-xl border border-gray-200 hover:border-[#0078D7]
                  hover:bg-[#e6f3fc] text-gray-400 hover:text-[#0078D7] flex items-center justify-center
                  transition-colors"
              >
                <Paperclip size={15} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { setImg(e.target.files?.[0]); if (e.target) e.target.value = ''; }} />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                placeholder="Write a message…"
                className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7]"
              />
              <Button size="sm" icon={<Send size={13} />} loading={sending} onClick={() => sendComment()}>
                Send
              </Button>
            </form>
          </div>
        )}

        {!canComment && (
          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-3 bg-gray-50 text-center">
            <p className="text-xs text-gray-400">This complaint is {complaint.status.toLowerCase()} — no further messages can be added.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
}

// ══════════════════════════════════════════════════════════════════════════
// Complaint Row (grid card)
// ══════════════════════════════════════════════════════════════════════════
function ComplaintRow({ c, onClick }: { c: Complaint; onClick: () => void }) {
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

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 px-4 py-2.5 flex flex-col gap-0.5">
        {/* Row 1: Title */}
        <p className="text-sm font-bold text-gray-800 truncate leading-snug">
          {c.title}
        </p>
        {/* Row 2: category · date · time */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-wrap">
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
              <span className="flex items-center gap-0.5">
                <Hash size={9} />#{c.bookingId}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Right: status + msgs ── */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1 px-3 py-2.5">
        <Badge label={c.status} color={complaintStatusColor(c.status)} />
        <span className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
          <MessageCircle size={10} />
          {c.comments.length} msg{c.comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Arrow — centred ── */}
      <div className="flex-shrink-0 pr-3 text-gray-300 group-hover:text-[#0078D7] transition-colors">
        <ChevronRight size={15} />
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════
export default function ComplaintPage() {
  const { user }     = useAuth();
  const { bookings } = useBookings();
  const myBookings   = bookings.filter((b) => b.userId === user?.id && b.status !== 'Cancelled');

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<'list' | 'new'>('list');
  const [selected,   setSelected]  = useState<Complaint | null>(null);
  const [categories, setCategories] = useState<ComplaintCategory[]>(FALLBACK_CATEGORIES);

  // Filters
  const [showFilters,   setShowFilters]   = useState(false);
  const [filterSearch,  setFilterSearch]  = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterCategory,setFilterCategory]= useState('');
  const [filterDateFrom,setFilterDateFrom]= useState('');
  const [filterDateTo,  setFilterDateTo]  = useState('');

  // Pagination
  const PAGE_SIZES = [10, 15, 20, 25, 30] as const;
  const [pageSize, setPageSize] = useState<number>(10);
  const [page,     setPage]     = useState(1);

  // New complaint form
  const [categoryId,  setCategoryId]  = useState<number | ''>('');
  const [bookingId,   setBookingId]   = useState('');
  const [title,       setTitle]       = useState('');
  const [desc,        setDesc]        = useState('');
  const [images,      setImages]      = useState<File[]>([]);
  const [submitting,  setSubmitting]  = useState(false);
  const [formErr,     setFormErr]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedCategory  = categories.find((c) => c.id === categoryId) ?? null;
  const showBookingPicker = selectedCategory ? requiresBooking(selectedCategory.name) : false;

  useEffect(() => {
    if (!user) return;
    complaintCategoryService.getAll()
      .then((r) => { if (r.success && r.data?.length) setCategories(r.data); })
      .catch(() => {});

    complaintService.getByUser(user.id)
      .then((r) => setComplaints(r.success ? (r.data ?? []) : []))
      .finally(() => setLoading(false));
  }, [user]);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files].slice(0, 5));
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submitComplaint(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) { setFormErr('Please enter a title.'); return; }
    if (!desc.trim())  { setFormErr('Please enter a description.'); return; }
    if (showBookingPicker && !bookingId) { setFormErr('Please select a related booking.'); return; }
    setFormErr('');
    setSubmitting(true);
    try {
      const res = await complaintService.create({
        bookingId:   showBookingPicker && bookingId ? Number(bookingId) : undefined,
        userId:      user.id,
        title:       title.trim(),
        description: desc.trim(),
        categoryId:  categoryId !== '' ? Number(categoryId) : undefined,
        category:    selectedCategory?.name,
      }, images.length > 0 ? images : undefined);

      if (res.success && res.data) {
        setComplaints((p) => [res.data, ...p]);
        setTitle(''); setDesc(''); setBookingId(''); setCategoryId(''); setImages([]);
        setTab('list');
        setSelected(res.data);
      } else {
        setFormErr(res.errors?.join(', ') ?? res.message ?? 'Submission failed.');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string; errors?: string[] } } })
            .response?.data?.message
          ?? (err as { response?: { data?: { errors?: string[] } } })
            .response?.data?.errors?.join(', ')
        : null;
      setFormErr(msg ?? 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCommentAdded(id: number, cm: ComplaintComment) {
    setComplaints((prev) =>
      prev.map((c) => c.id === id ? { ...c, comments: [...c.comments, cm] } : c));
    setSelected((prev) =>
      prev?.id === id ? { ...prev, comments: [...prev.comments, cm] } : prev);
  }

  function handleStatusChanged(id: number, newStatus: string) {
    setComplaints((prev) =>
      prev.map((c) => c.id === id ? { ...c, status: newStatus as never } : c));
    setSelected((prev) =>
      prev?.id === id ? { ...prev, status: newStatus as never } : prev);
  }

  // ── All derived values MUST be before any early return (Rules of Hooks) ──

  // Keep selectedComplaint fresh (after comments added)
  const freshSelected = selected ? (complaints.find((c) => c.id === selected.id) ?? selected) : null;

  // Active filter count for badge
  const activeFilterCount = [filterStatus, filterCategory, filterDateFrom, filterDateTo, filterSearch]
    .filter(Boolean).length;

  // Filtered list
  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (filterStatus   && c.status !== filterStatus)    return false;
      if (filterCategory && c.category !== filterCategory) return false;
      const q = filterSearch.toLowerCase();
      if (q && !c.title.toLowerCase().includes(q))        return false;
      if (filterDateFrom) {
        const from = new Date(filterDateFrom); from.setHours(0, 0, 0, 0);
        if (new Date(c.createdAt) < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo); to.setHours(23, 59, 59, 999);
        if (new Date(c.createdAt) > to) return false;
      }
      return true;
    });
  }, [complaints, filterStatus, filterCategory, filterSearch, filterDateFrom, filterDateTo]);

  // Pagination derived values
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged      = filtered.slice((page - 1) * pageSize, page * pageSize);

  function clearFilters() {
    setFilterSearch(''); setFilterStatus(''); setFilterCategory('');
    setFilterDateFrom(''); setFilterDateTo(''); setPage(1);
  }

  // ── Early return after all hooks ──────────────────────────────────────────
  if (loading) return <Spinner />;

  return (
    <div className="w-[80%] mx-auto space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Complaints</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} submitted
          </p>
        </div>
        <button
          onClick={() => setTab(tab === 'new' ? 'list' : 'new')}
          className="flex items-center gap-2 bg-gradient-to-r from-[#0078D7] to-[#025DB6]
            text-white text-sm font-semibold px-4 py-2.5 rounded-xl
            shadow-[0_2px_8px_-2px_rgb(0_120_215_/_0.40)]
            hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus size={14} />
          {tab === 'new' ? 'Back to list' : 'New Complaint'}
        </button>
      </div>

      {/* ── New Complaint Form ── */}
      {tab === 'new' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-6">
          <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#e6f3fc] flex items-center justify-center">
              <MessageSquareWarning size={14} className="text-[#0078D7]" />
            </div>
            File a New Complaint
          </h3>

          {formErr && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formErr}
            </div>
          )}

          <form onSubmit={submitComplaint} className="space-y-4">
            {/* Category */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : ''); setBookingId(''); }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7] bg-white"
              >
                <option value="">Select a category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Booking */}
            {showBookingPicker && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Related Booking
                  <span className="ml-1 text-xs text-gray-400 font-normal">(required)</span>
                </label>
                <select
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                    focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7] bg-white"
                >
                  <option value="">Select a booking…</option>
                  {myBookings.map((b) => (
                    <option key={b.id} value={b.id}>#{b.id} – {b.facilityName}</option>
                  ))}
                </select>
              </div>
            )}

            <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue" required />

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
              <textarea
                value={desc} onChange={(e) => setDesc(e.target.value)} required rows={4}
                placeholder="Describe your issue in detail…"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25
                  focus:border-[#0078D7] resize-none"
              />
            </div>

            {/* Images */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                <Paperclip size={13} /> Attachments
                <span className="text-xs text-gray-400 font-normal">up to 5 images</span>
              </label>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {images.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                      <ImageIcon size={13} className="text-[#0078D7] flex-shrink-0" />
                      <span className="text-xs text-gray-700 max-w-[140px] truncate">{f.name}</span>
                      <button type="button" onClick={() => setImages((p) => p.filter((_, ii) => ii !== i))}
                        className="text-gray-300 hover:text-red-500 ml-1"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileRef} type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={images.length >= 5}
                className="flex items-center gap-2 text-sm text-[#0078D7] hover:text-[#025DB6]
                  border border-dashed border-[#99cff3] hover:border-[#0078D7] rounded-xl
                  px-4 py-2.5 transition-colors disabled:opacity-40 bg-[#f0f8ff] hover:bg-[#e6f3fc]">
                <Paperclip size={14} />
                {images.length === 0 ? 'Attach images' : `Add more (${images.length}/5)`}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setTab('list')}>Cancel</Button>
              <Button type="submit" loading={submitting}>Submit Complaint</Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Complaints list ── */}
      {tab === 'list' && (
        complaints.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] py-14 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <MessageSquareWarning size={24} className="text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">No complaints filed yet</p>
              <p className="text-xs text-gray-400 mt-1">Use "New Complaint" to report an issue.</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Filter bar ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
              {/* Toggle row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
                    placeholder="Search by title…"
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200
                      focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7]
                      placeholder:text-gray-400"
                  />
                </div>
                {/* Filter toggle */}
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
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Expanded filter panel */}
              {showFilters && (
                <div className="border-t border-gray-100 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Status */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                      className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-700
                        focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] bg-white"
                    >
                      <option value="">All Statuses</option>
                      {['Open','InProgress','ActionRequired','MoreInfoRequired','Resolved','Rejected','Closed','Cancelled']
                        .map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {/* Category */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                      className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-700
                        focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] bg-white"
                    >
                      <option value="">All Categories</option>
                      {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  {/* Date from */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">From Date</label>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                      className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-700
                        focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7]"
                    />
                  </div>
                  {/* Date to */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">To Date</label>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                      className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-700
                        focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Count + page-size selector */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-gray-400">
                {filtered.length < complaints.length
                  ? <><span className="font-semibold text-[#0078D7]">{filtered.length}</span> of {complaints.length} complaints match</>
                  : <>Showing <span className="font-semibold text-gray-600">{Math.min((page-1)*pageSize+1, filtered.length)}–{Math.min(page*pageSize, filtered.length)}</span> of <span className="font-semibold text-gray-600">{complaints.length}</span> complaints</>
                }
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-xs whitespace-nowrap">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700
                    focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7] bg-white"
                >
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} per page</option>)}
                </select>
              </div>
            </div>

            {/* List card */}
            {paged.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] py-10 flex flex-col items-center gap-2 text-center">
                <Search size={20} className="text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No complaints match your filters</p>
                <button onClick={clearFilters} className="text-xs text-[#0078D7] hover:underline mt-1">Clear filters</button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Complaint</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pr-8">Status</span>
                </div>
                {paged.map((c) => (
                  <ComplaintRow key={c.id} c={c} onClick={() => setSelected(c)} />
                ))}
              </div>
            )}

            {/* Pagination controls */}
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
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">…</span>
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
        )
      )}

      {/* ── Detail popup ── */}
      {freshSelected && (
        <ComplaintDetailModal
          complaint={freshSelected}
          onClose={() => setSelected(null)}
          onCommentAdded={handleCommentAdded}
          onStatusChanged={handleStatusChanged}
        />
      )}
    </div>
  );
}
