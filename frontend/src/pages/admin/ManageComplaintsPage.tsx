import { useEffect, useState } from 'react';
import { complaintService }   from '../../services/complaintService';
import Badge, { complaintStatusColor } from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import type { Complaint, ComplaintStatus } from '../../types';

const STATUSES: ComplaintStatus[] = ['Open', 'InProgress', 'Resolved', 'Rejected'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ManageComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<ComplaintStatus | 'All'>('All');
  const [updating,   setUpdating]   = useState<number | null>(null);
  const [noteMap,    setNoteMap]    = useState<Record<number, string>>({});
  const [statusMap,  setStatusMap]  = useState<Record<number, ComplaintStatus>>({});

  useEffect(() => {
    complaintService.getAll()
      .then((r) => setComplaints(r.success ? r.data : []))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: number) {
    const status = statusMap[id];
    if (!status) return;
    setUpdating(id);
    try {
      const res = await complaintService.updateStatus(id, status, noteMap[id]);
      if (res.success) {
        setComplaints((prev) => prev.map((c) => c.id === id ? res.data : c));
        setNoteMap((p)   => ({ ...p, [id]: '' }));
        setStatusMap((p) => { const n = { ...p }; delete n[id]; return n; });
      }
    } finally {
      setUpdating(null);
    }
  }

  const filtered = filter === 'All' ? complaints : complaints.filter((c) => c.status === filter);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {(['All', ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === s ? 'bg-[#0078D7] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-14 text-center text-gray-400 shadow-card">
          No complaints found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge label={c.status} color={complaintStatusColor(c.status)} />
                    <span className="text-xs text-gray-400">#{c.id} Â· {c.userName} Â· {fmtDate(c.createdAt)}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{c.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                </div>
              </div>

              {/* Comments summary */}
              {c.comments.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Comments ({c.comments.length})
                  </p>
                  {c.comments.slice(-2).map((cm) => (
                    <div key={cm.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                      <span className="font-medium">{cm.authorName}:</span> {cm.text}
                    </div>
                  ))}
                </div>
              )}

              {/* Admin action panel */}
              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
                <select
                  value={statusMap[c.id] ?? c.status}
                  onChange={(e) => setStatusMap((p) => ({ ...p, [c.id]: e.target.value as ComplaintStatus }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700
                    focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 bg-white">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <input
                  value={noteMap[c.id] ?? ''}
                  onChange={(e) => setNoteMap((p) => ({ ...p, [c.id]: e.target.value }))}
                  placeholder="Admin note (optional)â€¦"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30" />

                <Button size="sm" loading={updating === c.id}
                  disabled={!statusMap[c.id] || statusMap[c.id] === c.status}
                  onClick={() => updateStatus(c.id)}>
                  Update
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

