import { useState } from 'react';
import { Plus, Pencil, Trash2, Dumbbell, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useActivities }     from '../../hooks/useActivities';
import { activityService }   from '../../services/activityService';
import Button   from '../../components/ui/Button';
import Spinner  from '../../components/ui/Spinner';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import type { Activity } from '../../types';

interface ActivityForm { name: string; durationMinutes: number; }
const EMPTY: ActivityForm = { name: '', durationMinutes: 0 };

export default function ManageActivitiesPage() {
  const { activities, loading, error: loadErr, refresh } = useActivities();

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem,  setEditItem]  = useState<Activity | null>(null);
  const [form,      setForm]      = useState<ActivityForm>(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [deleteId,  setDeleteId]  = useState<number | null>(null);
  const [deleting,  setDeleting]  = useState(false);
  const [toast,     setToast]     = useState<{ ok: boolean; msg: string } | null>(null);
  const [search,    setSearch]    = useState('');
  const [durFilter, setDurFilter] = useState<string>('');
  const [page,      setPage]      = useState(1);
  const [pageSize,  setPageSize]  = useState(15);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(a: Activity) {
    setEditItem(a);
    setForm({ name: a.name, durationMinutes: a.durationMinutes } satisfies ActivityForm);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editItem) {
        await activityService.update(editItem.id, { ...form, id: editItem.id });
        showToast(true, `Activity "${form.name}" updated.`);
      } else {
        await activityService.create(form);
        showToast(true, `Activity "${form.name}" created.`);
      }
      setModalOpen(false);
      refresh();
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
      await activityService.remove(deleteId);
      showToast(true, 'Activity deleted.');
      setDeleteId(null);
      refresh();
    } catch {
      showToast(false, 'Delete failed. The activity may have existing bookings.');
    } finally {
      setDeleting(false);
    }
  }

  const canSave = form.name.trim() !== '' && form.durationMinutes > 0;

  const DUR_OPTIONS = [
    { label: 'Any Duration', value: '' },
    { label: '30 min', value: '30' },
    { label: '60 min', value: '60' },
    { label: '90 min', value: '90' },
    { label: '120 min', value: '120' },
  ];

  const filtered = activities.filter(a => {
    const matchName = !search || a.name.toLowerCase().includes(search.toLowerCase());
    const matchDur  = !durFilter || a.durationMinutes === Number(durFilter);
    return matchName && matchDur;
  });
  const totalPagesA = Math.ceil(filtered.length / pageSize);
  const pagedA      = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (loading) return <Spinner fullPage />;

  return (
    <div className="w-[80%] mx-auto space-y-5">
      {toast && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium border
          ${toast.ok
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50    text-red-700    border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Dumbbell size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Activities</h1>
            <p className="text-sm text-gray-500">{activities.length} total</p>
          </div>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={openAdd}>
          Add Activity
        </Button>
      </div>

      {loadErr && (
        <p className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{loadErr}</p>
      )}

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by activity name..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200
              focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] placeholder:text-gray-400" />
        </div>
        <select value={durFilter} onChange={e => { setDurFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20">
          {DUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(search || durFilter) && (
          <button onClick={() => { setSearch(''); setDurFilter(''); setPage(1); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear</button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {activities.length}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">{filtered.length} activit{filtered.length !== 1 ? 'ies' : 'y'}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Show</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none">
              {[10, 15, 20, 25, 30, 50].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>per page</span>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['#', 'Name', 'Duration', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedA.length === 0 ? (
              <tr><td colSpan={4} className="py-10 text-center text-gray-400 text-sm">No activities found.</td></tr>
            ) : pagedA.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs">{a.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{a.name}</td>
                <td className="px-4 py-3 text-gray-600">{a.durationMinutes} min</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(a)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-[#0078D7] hover:bg-[#e6f3fc] transition-colors"
                      title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteId(a.id)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPagesA > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
            <span className="text-xs text-gray-400">Page {page} of {totalPagesA}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(5, totalPagesA) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPagesA - 4));
                const pg = start + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      pg === page ? 'bg-[#0078D7] text-white border-[#0078D7]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>{pg}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPagesA, p + 1))} disabled={page === totalPagesA}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Activity' : 'Add Activity'}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave} disabled={!canSave}>
              {editItem ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Name" required>
            <input value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Yoga"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent" />
          </FormField>
          <FormField label="Duration (minutes)" required>
            <input type="number" min={1} value={form.durationMinutes || ''}
              onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
              placeholder="e.g. 60"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent" />
          </FormField>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Activity"
        description="Are you sure you want to delete this activity? This action cannot be undone and will fail if the activity has existing bookings."
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
      />
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

