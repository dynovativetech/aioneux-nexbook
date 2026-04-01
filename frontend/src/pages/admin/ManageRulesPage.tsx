import { useEffect, useState } from 'react';
import { ScrollText, Save } from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { rulesDocumentService } from '../../services/rulesDocumentService';
import { locationService } from '../../services/locationService';
import type { Community } from '../../types';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - react-quill types may be absent depending on TS setup
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function toast(ok: boolean, msg: string, set: (v: { ok: boolean; msg: string } | null) => void) {
  set({ ok, msg });
  setTimeout(() => set(null), 4000);
}

export default function ManageRulesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  const [communities, setCommunities] = useState<Community[]>([]);
  const [communityId, setCommunityId] = useState<number | undefined>(undefined);
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    locationService.getCommunities()
      .then((cs) => setCommunities(cs))
      .catch(() => setCommunities([]));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const doc = await rulesDocumentService.getAdmin();
        setCommunityId(doc?.communityId);
        setHtml(doc?.html || '');
      } catch {
        toast(false, 'Failed to load rules document.', setToastMsg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave() {
    if (!html || html.replace(/<[^>]*>/g, '').trim().length === 0) {
      toast(false, 'Rules content is required.', setToastMsg);
      return;
    }
    setSaving(true);
    try {
      await rulesDocumentService.upsertAdmin({
        communityId,
        html,
      });
      toast(true, 'Rules saved.', setToastMsg);
    } catch (e: unknown) {
      toast(false, e instanceof Error ? e.message : 'Save failed.', setToastMsg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner fullPage />;

  return (
    <div className="w-[80%] mx-auto space-y-5">
      {toastMsg && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium border ${
            toastMsg.ok
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {toastMsg.msg}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#cce7f9] rounded-lg">
            <ScrollText size={20} className="text-[#0078D7]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Community Rules</h1>
            <p className="text-sm text-gray-500">One formatted rules page (shown to members)</p>
          </div>
        </div>
        <Button variant="primary" size="sm" icon={<Save size={15} />} loading={saving} onClick={handleSave}>
          Save
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-4 space-y-4">
        <label className="block text-xs font-semibold text-gray-500">
          Target community (optional)
          <select
            value={communityId ?? ''}
            onChange={(e) => setCommunityId(e.target.value ? Number(e.target.value) : undefined)}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
          >
            <option value="">All members (tenant-wide)</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">Rules content *</div>
          <ReactQuill
            theme="snow"
            value={html}
            onChange={setHtml}
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'code-block'],
                ['link'],
                ['clean'],
              ],
            }}
          />
          <p className="mt-2 text-xs text-gray-400">
            This will be displayed on the member portal exactly as formatted.
          </p>
        </div>
      </div>
    </div>
  );
}

