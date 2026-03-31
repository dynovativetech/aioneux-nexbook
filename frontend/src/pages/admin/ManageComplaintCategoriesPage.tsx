import { useEffect, useState, type FormEvent } from 'react';
import { Tag, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import {
  complaintCategoryService,
  FALLBACK_CATEGORIES,
} from '../../services/complaintCategoryService';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import type { ComplaintCategory } from '../../types';

export default function ManageComplaintCategoriesPage() {
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [newName,    setNewName]    = useState('');
  const [adding,     setAdding]     = useState(false);
  const [addErr,     setAddErr]     = useState('');
  const [editId,     setEditId]     = useState<number | null>(null);
  const [editName,   setEditName]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState<number | null>(null);

  useEffect(() => {
    complaintCategoryService.getAll()
      .then((r) => setCategories(r.success && r.data?.length ? r.data : FALLBACK_CATEGORIES))
      .catch(() => setCategories(FALLBACK_CATEGORIES))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) { setAddErr('Name is required.'); return; }
    setAddErr('');
    setAdding(true);
    try {
      const res = await complaintCategoryService.create(newName.trim());
      if (res.success) {
        setCategories((prev) => [...prev, res.data]);
        setNewName('');
      } else {
        setAddErr(res.message ?? 'Failed to add category.');
      }
    } catch {
      setAddErr('Failed to add category. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit(id: number) {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await complaintCategoryService.update(id, editName.trim());
      if (res.success) {
        setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name: editName.trim() } : c));
        setEditId(null);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this category? It will no longer be available for new complaints.')) return;
    setDeleting(id);
    try {
      await complaintCategoryService.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Complaint Categories</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage the categories customers can select when submitting a complaint.
        </p>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Plus size={14} /> Add New Category
        </h3>

        {addErr && (
          <p className="text-sm text-red-600 mb-3">{addErr}</p>
        )}

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Payment Issue"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800
              focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7]"
          />
          <Button type="submit" loading={adding} size="sm">
            Add
          </Button>
        </form>
      </div>

      {/* Category list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] divide-y divide-gray-50">
        {categories.length === 0 && (
          <div className="py-10 text-center text-gray-400 text-sm">
            <Tag size={24} className="mx-auto mb-2 opacity-30" />
            No categories yet.
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-7 h-7 rounded-lg bg-[#e6f3fc] flex items-center justify-center flex-shrink-0">
              <Tag size={13} className="text-[#0078D7]" />
            </div>

            {editId === cat.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(cat.id);
                  if (e.key === 'Escape') setEditId(null);
                }}
              />
            ) : (
              <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
            )}

            <div className="flex items-center gap-1 flex-shrink-0">
              {editId === cat.id ? (
                <>
                  <button
                    onClick={() => handleSaveEdit(cat.id)}
                    disabled={saving}
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#0078D7] hover:bg-[#e6f3fc] transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={deleting === cat.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
