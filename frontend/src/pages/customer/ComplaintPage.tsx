import { useEffect, useState, type FormEvent } from 'react';
import { MessageSquareWarning, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth }           from '../../context/AuthContext';
import { useBookings }       from '../../hooks/useBookings';
import { complaintService }  from '../../services/complaintService';
import Badge, { complaintStatusColor } from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Input   from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import type { Complaint } from '../../types';

export default function ComplaintPage() {
  const { user }  = useAuth();
  const { bookings } = useBookings();
  const myBookings   = bookings.filter((b) => b.userId === user?.id && b.status !== 'Cancelled');

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab,     setTab]           = useState<'list' | 'new'>('list');
  const [expanded, setExpanded]     = useState<number | null>(null);

  // New complaint form
  const [bookingId, setBookingId]   = useState('');
  const [title,     setTitle]       = useState('');
  const [desc,      setDesc]        = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErr,    setFormErr]    = useState('');

  // Comment form
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [commenting,  setCommenting]  = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    complaintService.getByUser(user.id)
      .then((r) => setComplaints(r.success ? r.data : []))
      .finally(() => setLoading(false));
  }, [user]);

  async function submitComplaint(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setFormErr('');
    setSubmitting(true);
    try {
      const res = await complaintService.create({
        bookingId: Number(bookingId),
        userId:    user.id,
        title:     title.trim(),
        description: desc.trim(),
      });
      if (res.success) {
        setComplaints((p) => [res.data, ...p]);
        setTitle(''); setDesc(''); setBookingId('');
        setTab('list');
      } else {
        setFormErr(res.errors?.join(', ') ?? res.message);
      }
    } catch {
      setFormErr('Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  }

  async function addComment(id: number) {
    if (!user || !commentText[id]?.trim()) return;
    setCommenting(id);
    try {
      const res = await complaintService.addComment(id, user.id, commentText[id].trim());
      if (res.success) {
        setComplaints((prev) =>
          prev.map((c) => c.id === id
            ? { ...c, comments: [...c.comments, res.data] } : c));
        setCommentText((p) => ({ ...p, [id]: '' }));
      }
    } finally {
      setCommenting(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Tabs */}
      <div className="flex gap-2">
        {(['list', 'new'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t ? 'bg-[#0078D7] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === 'list' ? `My Complaints (${complaints.length})` : '+ New Complaint'}
          </button>
        ))}
      </div>

      {/* New Complaint form */}
      {tab === 'new' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-6">
          <h2 className="font-semibold text-gray-800 mb-5">File a Complaint</h2>

          {formErr && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formErr}
            </div>
          )}

          <form onSubmit={submitComplaint} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Booking</label>
              <select value={bookingId} onChange={(e) => setBookingId(e.target.value)} required
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 bg-white">
                <option value="">Select a bookingâ€¦</option>
                {myBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} â€“ {b.facilityName} / {b.activityName}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue" required />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} required rows={4}
                placeholder="Provide as much detail as possibleâ€¦"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 resize-none" />
            </div>
            <Button type="submit" loading={submitting}>Submit Complaint</Button>
          </form>
        </div>
      )}

      {/* Complaints list */}
      {tab === 'list' && (
        complaints.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] py-14 text-center text-gray-400">
            <MessageSquareWarning size={36} className="mx-auto mb-3 opacity-30" />
            <p>No complaints filed yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
                {/* Header row */}
                <button className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge label={c.status} color={complaintStatusColor(c.status)} />
                      <span className="text-xs text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <p className="font-medium text-gray-800 text-sm">{c.title}</p>
                  </div>
                  {expanded === c.id ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                    : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </button>

                {/* Expanded detail */}
                {expanded === c.id && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                    <p className="text-sm text-gray-600">{c.description}</p>

                    {/* Comments */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Comments ({c.comments.length})
                      </p>
                      {c.comments.map((cm) => (
                        <div key={cm.id} className="bg-gray-50 rounded-lg px-3 py-2.5">
                          <p className="text-xs font-medium text-gray-700">{cm.authorName}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{cm.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Add comment (only if not resolved/rejected) */}
                    {c.status !== 'Resolved' && c.status !== 'Rejected' && (
                      <div className="flex gap-2">
                        <input
                          value={commentText[c.id] ?? ''}
                          onChange={(e) => setCommentText((p) => ({ ...p, [c.id]: e.target.value }))}
                          placeholder="Add a commentâ€¦"
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm
                            focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30" />
                        <Button size="sm" icon={<Send size={13} />}
                          loading={commenting === c.id}
                          onClick={() => addComment(c.id)}>
                          Send
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

