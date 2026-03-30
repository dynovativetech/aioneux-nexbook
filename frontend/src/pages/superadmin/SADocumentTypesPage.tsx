import { useEffect, useState } from 'react';
import { Plus, Trash2, FileText, Star } from 'lucide-react';
import { getDocumentTypes, createDocumentType, deleteDocumentType } from '../../services/tenantService';
import type { TenantDocumentType } from '../../types';

export default function SADocumentTypesPage() {
  const [types, setTypes]       = useState<TenantDocumentType[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [required, setRequired] = useState(false);
  const [order, setOrder]       = useState(0);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = () => {
    setLoading(true);
    getDocumentTypes().then(setTypes).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createDocumentType(name.trim(), desc.trim() || undefined, required, order);
      setShowForm(false);
      setName(''); setDesc(''); setRequired(false); setOrder(0);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this document type?')) return;
    try { await deleteDocumentType(id); load(); } catch (err) { console.error(err); }
  };

  const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Document Types</h2>
          <p className="text-gray-400 mt-1">Define the document types tenants are required or allowed to upload</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Add Type
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          <h3 className="text-white font-semibold">New Document Type</h3>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name <span className="text-red-400">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Trade License" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sort Order</label>
              <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className={inputCls} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)}
                  className="w-4 h-4 accent-violet-500" />
                <span className="text-sm text-gray-300">Mark as Required</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Savingâ€¦' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-gray-400">Loadingâ€¦</div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">Required</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {types.map(t => (
                <tr key={t.id}>
                  <td className="px-5 py-3 text-gray-400 text-xs">{t.sortOrder}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-violet-400" />
                      <span className="text-white font-medium">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{t.description ?? 'â€”'}</td>
                  <td className="px-5 py-3">
                    {t.isRequired && <span className="flex items-center gap-1 text-xs text-amber-400"><Star size={11} />Required</span>}
                  </td>
                  <td className="px-5 py-3 flex justify-end gap-2">
                    <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-400 transition-colors" title="Remove">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {types.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No document types configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

