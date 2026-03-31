import { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Pencil, Trash2, ChevronRight, Search, ChevronLeft } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]); // for search-all mode

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

  // Load ALL communities for global search
  useEffect(() => {
    getCommunities().then(setAllCommunities).catch(() => {});
  }, []);

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
    setPage(1);
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
    <div className="w-[80%] mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="text-[#0078D7]" size={20} />
          <h1 className="text-xl font-semibold text-gray-800">Communities</h1>
        </div>
        {!filter.areaId && (
          <span className="text-xs text-gray-400">Select an Area to add communities</span>
        )}
      </div>

      {/* Unified filter bar: search + location dropdowns */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] px-4 py-3 space-y-3">
        {/* Row 1: search + Add button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search all communities by name..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] placeholder:text-gray-400" />
          </div>
          {filter.areaId && (
            <Button variant="primary" size="sm" onClick={openAdd} className="flex items-center gap-1.5 flex-shrink-0">
              <Plus size={15} /> Add Community
            </Button>
          )}
        </div>
        {/* Row 2: location cascade (optional) */}
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Filter by location:</span>
          <select value={filter.countryId ?? ''} onChange={e => {
            setFilter(f => ({ ...f, countryId: e.target.value ? Number(e.target.value) : null, cityId: null, areaId: null }));
            setPage(1);
          }} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20">
            <option value="">All Countries</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {filter.countryId && (
            <>
              <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
              <select value={filter.cityId ?? ''} onChange={e => {
                setFilter(f => ({ ...f, cityId: e.target.value ? Number(e.target.value) : null, areaId: null }));
                setPage(1);
              }} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20">
                <option value="">All Cities</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </>
          )}
          {filter.cityId && (
            <>
              <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
              <select value={filter.areaId ?? ''} onChange={e => {
                setFilter(f => ({ ...f, areaId: e.target.value ? Number(e.target.value) : null }));
                setPage(1);
              }} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20">
                <option value="">All Areas</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </>
          )}
          {(search || filter.countryId || filter.cityId || filter.areaId) && (
            <button onClick={() => {
              setSearch(''); setFilter({ countryId: null, cityId: null, areaId: null }); setPage(1);
            }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
          )}
        </div>
      </div>

      {/* Communities table */}
      {(() => {
        // Determine which list to display
        const searchActive = search.trim().length > 0;
        const displayList = filter.areaId
          ? communities.filter(c => !searchActive || c.name.toLowerCase().includes(search.toLowerCase()))
          : searchActive
            ? allCommunities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            : null; // null = show prompt

        if (loading) return <Spinner fullPage />;

        if (displayList === null) {
          return (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <MapPin size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">
                Search communities by name above, or select Country → City → Area to browse by location.
              </p>
            </div>
          );
        }

        const totalPagesC = Math.ceil(displayList.length / pageSize);
        const pagedC = displayList.slice((page - 1) * pageSize, page * pageSize);

        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-medium text-gray-700">
                {filter.areaId ? (
                  <>Communities in <span className="text-[#0078D7]">{selectedArea?.name}</span></>
                ) : (
                  <>Search results</>
                )}
                <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {displayList.length}
                </span>
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Show</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none">
                  {[10, 15, 20, 25, 30, 50].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span>per page</span>
              </div>
            </div>

            {displayList.length === 0 ? (
              <div className="py-16 text-center">
                <MapPin size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-400 text-sm">No communities found.</p>
                {filter.areaId && (
                  <button onClick={openAdd} className="mt-3 text-sm text-[#0078D7] hover:underline">
                    Add the first community
                  </button>
                )}
              </div>
            ) : (
              <>
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
                    {pagedC.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{c.name}</td>
                        <td className="px-5 py-3 text-gray-500 max-w-xs truncate">
                          {c.description ?? <span className="text-gray-300 italic">-</span>}
                        </td>
                        <td className="px-5 py-3 text-gray-500">{c.areaName}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => openEdit(c)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#0078D7] hover:bg-[#e6f3fc] transition-colors" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteId(c.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPagesC > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                    <span className="text-xs text-gray-400">Page {page} of {totalPagesC}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                        <ChevronLeft size={13} />
                      </button>
                      {Array.from({ length: Math.min(5, totalPagesC) }, (_, i) => {
                        const start = Math.max(1, Math.min(page - 2, totalPagesC - 4));
                        const pg = start + i;
                        return (
                          <button key={pg} onClick={() => setPage(pg)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                              pg === page ? 'bg-[#0078D7] text-white border-[#0078D7]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}>{pg}</button>
                        );
                      })}
                      <button onClick={() => setPage(p => Math.min(totalPagesC, p + 1))} disabled={page === totalPagesC}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

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
              placeholder="Optional description..."
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
                <option value="">- select area -</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!canSave || saving}>
              {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Create'}
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

