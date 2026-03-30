import { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import {
  getCountries, getCities, getAreas, getCommunities,
  createCommunity, updateCommunity, deleteCommunity,
} from '../../services/locationService';
import type { Country, City, Area, Community } from '../../types';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal, { ConfirmModal } from '../../components/ui/Modal';

// â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Toast({ ok, msg, onClose }: { ok: boolean; msg: string; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all
      ${ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">âœ•</button>
    </div>
  );
}

// â”€â”€ Cascading selectors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface FilterState {
  countryId: number | null;
  cityId:    number | null;
  areaId:    number | null;
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ManageCommunitiesPage() {
  // Location hierarchy
  const [countries,    setCountries]    = useState<Country[]>([]);
  const [cities,       setCities]       = useState<City[]>([]);
  const [areas,        setAreas]        = useState<Area[]>([]);
  const [communities,  setCommunities]  = useState<Community[]>([]);

  const [filter, setFilter] = useState<FilterState>({ countryId: null, cityId: null, areaId: null });
  const [loading, setLoading] = useState(false);

  // Modal state
  const [formOpen,  setFormOpen]  = useState(false);
  const [editItem,  setEditItem]  = useState<Community | null>(null);
  const [formName,  setFormName]  = useState('');
  const [formDesc,  setFormDesc]  = useState('');
  const [formAreaId, setFormAreaId] = useState<number | null>(null);
  const [saving,    setSaving]    = useState(false);

  const [deleteId,  setDeleteId]  = useState<number | null>(null);
  const [deleting,  setDeleting]  = useState(false);

  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  // Load countries on mount
  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
  }, []);

  // Load cities when country changes
  useEffect(() => {
    setCities([]); setAreas([]); setCommunities([]);
    setFilter(f => ({ ...f, cityId: null, areaId: null }));
    if (filter.countryId) {
      getCities(filter.countryId).then(setCities).catch(() => {});
    }
  }, [filter.countryId]);

  // Load areas when city changes
  useEffect(() => {
    setAreas([]); setCommunities([]);
    setFilter(f => ({ ...f, areaId: null }));
    if (filter.cityId) {
      getAreas(filter.cityId).then(setAreas).catch(() => {});
    }
  }, [filter.cityId]);

  // Load communities when area changes
  const loadCommunities = useCallback(async (areaId: number | null) => {
    if (!areaId) { setCommunities([]); return; }
    setLoading(true);
    try {
      const data = await getCommunities(areaId);
      setCommunities(data);
    } catch {
      showToast(false, 'Failed to load communities.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunities(filter.areaId);
  }, [filter.areaId, loadCommunities]);

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function openAdd() {
    setEditItem(null);
    setFormName('');
    setFormDesc('');
    setFormAreaId(filter.areaId);
    setFormOpen(true);
  }

  function openEdit(c: Community) {
    setEditItem(c);
    setFormName(c.name);
    setFormDesc(c.description ?? '');
    setFormAreaId(c.areaId);
    setFormOpen(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formAreaId) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateCommunity(editItem.id, formName.trim(), formDesc || undefined);
        showToast(true, `Community "${formName}" updated.`);
      } else {
        await createCommunity(formAreaId, formName.trim(), formDesc || undefined);
        showToast(true, `Community "${formName}" created.`);
      }
      setFormOpen(false);
      await loadCommunities(filter.areaId);
    } catch {
      showToast(false, 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await deleteCommunity(deleteId);
      showToast(true, 'Community deleted.');
      setDeleteId(null);
      await loadCommunities(filter.areaId);
    } catch {
      showToast(false, 'Delete failed. The community may have linked venues.');
    } finally {
      setDeleting(false);
    }
  }

  const canSave = formName.trim() !== '' && formAreaId !== null;
  const selectedArea = areas.find(a => a.id === filter.areaId);

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="text-[#0078D7]" size={20} />
          <h1 className="text-xl font-semibold text-gray-800">Communities</h1>
        </div>
        {filter.areaId && (
          <Button variant="primary" size="sm" onClick={openAdd} className="flex items-center gap-1.5">
            <Plus size={15} /> Add Community
          </Button>
        )}
      </div>

      {/* Breadcrumb filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Filter by Location
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {/* Country */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Country</label>
            <select
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
              value={filter.countryId ?? ''}
              onChange={e => setFilter(f => ({ ...f, countryId: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">â€” select â€”</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {filter.countryId && (
            <>
              <ChevronRight size={14} className="text-gray-300" />
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">City</label>
                <select
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  value={filter.cityId ?? ''}
                  onChange={e => setFilter(f => ({ ...f, cityId: e.target.value ? Number(e.target.value) : null }))}
                >
                  <option value="">â€” select â€”</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </>
          )}

          {filter.cityId && (
            <>
              <ChevronRight size={14} className="text-gray-300" />
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Area</label>
                <select
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  value={filter.areaId ?? ''}
                  onChange={e => setFilter(f => ({ ...f, areaId: e.target.value ? Number(e.target.value) : null }))}
                >
                  <option value="">â€” select â€”</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Communities table */}
      {!filter.areaId ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <MapPin size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">Select Country â†’ City â†’ Area above to see communities.</p>
        </div>
      ) : loading ? (
        <Spinner fullPage />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">
              Communities in <span className="text-[#0078D7]">{selectedArea?.name}</span>
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {communities.length}
              </span>
            </p>
          </div>

          {communities.length === 0 ? (
            <div className="py-16 text-center">
              <MapPin size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-gray-400 text-sm">No communities found.</p>
              <button onClick={openAdd} className="mt-3 text-sm text-[#0078D7] hover:underline">
                Add the first community
              </button>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">Description</th>
                  <th className="px-5 py-3 text-left font-medium">Area</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {communities.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">
                      {c.description ?? <span className="text-gray-300 italic">â€”</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{c.areaName}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#0078D7] hover:bg-[#e6f3fc] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editItem ? 'Edit Community' : 'Add Community'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
              placeholder="e.g. Jumeirah Gardens"
              value={formName}
              onChange={e => setFormName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 resize-none"
              placeholder="Optional descriptionâ€¦"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
            />
          </div>
          {!editItem && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Area *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                value={formAreaId ?? ''}
                onChange={e => setFormAreaId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">â€” select area â€”</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!canSave || saving}>
              {saving ? 'Savingâ€¦' : editItem ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Community"
        description="Are you sure? This cannot be undone. Linked venues must be removed first."
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />

      {/* Toast */}
      {toast && <Toast ok={toast.ok} msg={toast.msg} onClose={() => setToast(null)} />}
    </div>
  );
}

