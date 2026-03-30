import { useState } from 'react';
import { Plus, Pencil, Trash2, UserCheck } from 'lucide-react';
import { useInstructors }     from '../../hooks/useInstructors';
import { instructorService }  from '../../services/instructorService';
import Button   from '../../components/ui/Button';
import Spinner  from '../../components/ui/Spinner';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import type { Instructor } from '../../types';

interface InstructorForm { name: string; expertise: string; experienceYears: number; }
const EMPTY: InstructorForm = { name: '', expertise: '', experienceYears: 0 };

export default function ManageInstructorsPage() {
  const { instructors, loading, error: loadErr, refresh } = useInstructors();

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem,  setEditItem]  = useState<Instructor | null>(null);
  const [form,      setForm]      = useState<InstructorForm>(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [deleteId,  setDeleteId]  = useState<number | null>(null);
  const [deleting,  setDeleting]  = useState(false);
  const [toast,     setToast]     = useState<{ ok: boolean; msg: string } | null>(null);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(i: Instructor) {
    setEditItem(i);
    setForm({ name: i.name, expertise: i.expertise, experienceYears: i.experienceYears } satisfies InstructorForm);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editItem) {
        await instructorService.update(editItem.id, { ...form, id: editItem.id });
        showToast(true, `Instructor "${form.name}" updated.`);
      } else {
        await instructorService.create(form);
        showToast(true, `Instructor "${form.name}" created.`);
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
      await instructorService.remove(deleteId);
      showToast(true, 'Instructor deleted.');
      setDeleteId(null);
      refresh();
    } catch {
      showToast(false, 'Delete failed. The instructor may have existing bookings.');
    } finally {
      setDeleting(false);
    }
  }

  const canSave = form.name.trim() !== '' && form.expertise.trim() !== '' && form.experienceYears >= 0;

  if (loading) return <Spinner fullPage />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
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
          <div className="p-2 bg-[#e6f3fc] rounded-lg">
            <UserCheck size={20} className="text-[#025DB6]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Instructors</h1>
            <p className="text-sm text-gray-500">{instructors.length} total</p>
          </div>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={openAdd}>
          Add Instructor
        </Button>
      </div>

      {loadErr && (
        <p className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{loadErr}</p>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['#', 'Name', 'Expertise', 'Experience', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {instructors.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-gray-400 text-sm">No instructors yet.</td></tr>
            ) : instructors.map(i => (
              <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs">{i.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{i.name}</td>
                <td className="px-4 py-3 text-gray-600">{i.expertise}</td>
                <td className="px-4 py-3 text-gray-600">{i.experienceYears} yr{i.experienceYears !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(i)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-[#0078D7] hover:bg-[#e6f3fc] transition-colors"
                      title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteId(i.id)}
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
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Instructor' : 'Add Instructor'}
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
              placeholder="e.g. Sara Lee"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent" />
          </FormField>
          <FormField label="Expertise" required>
            <input value={form.expertise}
              onChange={e => setForm(p => ({ ...p, expertise: e.target.value }))}
              placeholder="e.g. Yoga"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent" />
          </FormField>
          <FormField label="Experience (years)" required>
            <input type="number" min={0} value={form.experienceYears || ''}
              onChange={e => setForm(p => ({ ...p, experienceYears: Number(e.target.value) }))}
              placeholder="e.g. 5"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent" />
          </FormField>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Instructor"
        description="Are you sure you want to delete this instructor? This action cannot be undone and will fail if the instructor has existing bookings."
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

