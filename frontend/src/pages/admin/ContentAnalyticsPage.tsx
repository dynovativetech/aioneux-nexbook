import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import { announcementService, type AnnouncementAnalyticsRow } from '../../services/announcementService';

export default function ContentAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AnnouncementAnalyticsRow[]>([]);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    announcementService.analytics()
      .then((data) => setRows(data))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullPage />;

  return (
    <div className="w-[80%] mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#cce7f9] rounded-lg">
          <BarChart3 size={20} className="text-[#0078D7]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Content Analytics</h1>
          <p className="text-sm text-gray-500">Announcement views and engagement</p>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          {err}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Title', 'Status', 'Total views', 'Unique viewers', 'Created'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    No analytics data yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.announcementId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{r.announcementId}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {r.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{r.totalViews}</td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{r.uniqueViewers}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

