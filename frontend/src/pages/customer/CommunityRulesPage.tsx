import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import { communityService, type MemberRule } from '../../services/communityService';
import { rulesDocumentService } from '../../services/rulesDocumentService';
import DOMPurify from 'dompurify';

export default function CommunityRulesPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MemberRule[]>([]);
  const [docHtml, setDocHtml] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      rulesDocumentService.getForMember(),
      communityService.listRules(),
    ])
      .then(([doc, legacy]) => {
        setDocHtml(doc?.html ?? null);
        setRows(legacy);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Failed to load rules.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullPage />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#cce7f9] rounded-lg">
          <ScrollText size={20} className="text-[#0078D7]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Rules</h1>
          <p className="text-sm text-gray-500">Community and facility guidelines</p>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          {err}
        </div>
      )}

      {docHtml && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
          <div
            className="px-5 py-5 prose max-w-none"
            // Admin-controlled HTML; sanitize to reduce XSS risk.
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(docHtml) }}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
        {rows.length === 0 && !docHtml ? (
          <div className="py-12 text-center text-gray-400 text-sm">No rules published yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((r) => (
              <div key={r.id} className="px-5 py-4">
                <p className="font-semibold text-gray-800">{r.title}</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{r.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

