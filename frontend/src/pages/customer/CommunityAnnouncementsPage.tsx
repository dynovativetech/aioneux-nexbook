import { useEffect, useState } from 'react';
import { Megaphone, CheckCircle2 } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { communityService, type MemberAnnouncement } from '../../services/communityService';

export default function CommunityAnnouncementsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MemberAnnouncement[]>([]);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<MemberAnnouncement | null>(null);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await communityService.listAnnouncements();
      setRows(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  async function openAnnouncement(a: MemberAnnouncement) {
    setOpen(a);
    if (!a.isViewed) {
      try {
        await communityService.markViewed(a.id);
        setRows((prev) => prev.map((x) => (x.id === a.id ? { ...x, isViewed: true } : x)));
      } catch {
        // ignore
      }
    }
  }

  if (loading) return <Spinner fullPage />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#cce7f9] rounded-lg">
          <Megaphone size={20} className="text-[#0078D7]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Announcements</h1>
          <p className="text-sm text-gray-500">Updates from your community</p>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          {err}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
        <div className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No announcements yet.</div>
          ) : (
            rows.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => openAnnouncement(a)}
                className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  {a.isViewed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} /> Read
                    </span>
                  ) : (
                    <span className="inline-flex text-xs font-semibold text-[#025DB6] bg-[#e6f3fc] border border-[#cce7f9] px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={open !== null}
        onClose={() => setOpen(null)}
        title={open?.title ?? 'Announcement'}
        size="lg"
        footer={(
          <div className="flex justify-end w-full">
            <Button size="sm" onClick={() => setOpen(null)}>Close</Button>
          </div>
        )}
      >
        <div className="prose prose-sm max-w-none">
          <p className="text-xs text-gray-400 mb-3">
            {open?.createdAt ? new Date(open.createdAt).toLocaleString() : null}
          </p>
          <p className="whitespace-pre-wrap text-gray-700">{open?.body}</p>
        </div>
      </Modal>
    </div>
  );
}

