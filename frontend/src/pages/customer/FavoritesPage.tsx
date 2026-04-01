import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { favoriteService, type FavoriteDto } from '../../services/favoriteService';

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<FavoriteDto[]>([]);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await favoriteService.list();
      setRows(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load favorites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  async function removeFav(f: FavoriteDto) {
    setErr('');
    try {
      await favoriteService.remove(f.targetType as any, f.targetId);
      setRows((prev) => prev.filter((x) => x.id !== f.id));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to remove favorite.');
    }
  }

  if (loading) return <Spinner fullPage />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#cce7f9] rounded-lg">
          <Heart size={20} className="text-[#0078D7]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Favorites</h1>
          <p className="text-sm text-gray-500">Your saved venues and facilities</p>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          {err}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No favorites yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((f) => (
              <div key={f.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{f.name ?? `${f.targetType} #${f.targetId}`}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {f.targetType} · saved {new Date(f.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeFav(f)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

