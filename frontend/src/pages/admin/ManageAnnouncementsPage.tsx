import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Plus, Pencil, Trash2, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { announcementService, type AdminAnnouncementDetail, type UpsertAnnouncementPayload } from '../../services/announcementService';
import { locationService } from '../../services/locationService';
import type { Area, Community } from '../../types';

function toast(ok: boolean, msg: string, set: (v: { ok: boolean; msg: string } | null) => void) {
  set({ ok, msg });
  setTimeout(() => set(null), 4000);
}

export default function ManageAnnouncementsPage() {
  const [rows, setRows] = useState<AdminAnnouncementDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [areas] = useState<Area[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  const [form, setForm] = useState<UpsertAnnouncementPayload>({
    title: '',
    body: '',
    isPublished: false,
    publishAt: undefined,
    areaId: undefined,
    communityId: undefined,
  });

  const load = async () => {
    setLoading(true);
    try {
      const list = await announcementService.list();
      // list endpoint does not include body; fetch only when editing, but for simple display we keep list shape
      const hydrated: AdminAnnouncementDetail[] = list.map((x) => ({ ...x, body: '' }));
      setRows(hydrated);
    } catch {
      toast(false, 'Failed to load announcements.', setToastMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // For targeting, reuse tenant-scoped Areas/Communities. We need a cityId to load areas, but Areas are tenant scoped.
  // Workaround: load communities without filter (tenant-scoped) and infer areas list from returned communities/areas in admin pages later.
  // For now, we load communities (tenant-scoped) and areas by asking for cityId is not possible. We'll instead only allow Community targeting
  // via the existing ManageCommunities page until a tenant-scoped "list areas" endpoint is added.
  //
  // However, since you already have Areas and Communities tenant-scoped in DB, we can load communities without areaId and allow selecting community,
  // and keep area optional/manual for now.
  useEffect(() => {
    locationService.getCommunities()
      .then((cs) => setCommunities(cs))
      .catch(() => setCommunities([]));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.title.toLowerCase().includes(q)
      || String(r.id).includes(q)
      || (r.communityName?.toLowerCase().includes(q) ?? false)
      || (r.areaName?.toLowerCase().includes(q) ?? false)
    );
  }, [rows, search]);

  function openCreate() {
    setMode('create');
    setEditingId(null);
    setForm({
      title: '',
      body: '',
      isPublished: false,
      publishAt: undefined,
      areaId: undefined,
      communityId: undefined,
    });
    setModalOpen(true);
  }

  async function openEdit(id: number) {
    setMode('edit');
    setEditingId(id);
    setModalOpen(true);
    setSaving(true);
    try {
      const d = await announcementService.get(id);
      setForm({
        title: d.title,
        body: d.body,
        isPublished: d.isPublished,
        publishAt: d.publishAt,
        areaId: d.areaId,
        communityId: d.communityId,
      });
    } catch {
      toast(false, 'Failed to load announcement.', setToastMsg);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim() || !form.body.trim()) {
      toast(false, 'Title and message are required.', setToastMsg);
      return;
    }
    setSaving(true);
    try {
      const payload: UpsertAnnouncementPayload = {
        title: form.title.trim(),
        body: form.body.trim(),
        isPublished: form.isPublished,
        publishAt: form.publishAt || undefined,
        areaId: form.areaId || undefined,
        communityId: form.communityId || undefined,
      };
      if (mode === 'create') {
        await announcementService.create(payload);
        toast(true, 'Announcement created.', setToastMsg);
      } else if (editingId != null) {
        await announcementService.update(editingId, payload);
        toast(true, 'Announcement updated.', setToastMsg);
      }
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      toast(false, e instanceof Error ? e.message : 'Save failed.', setToastMsg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (confirmDeleteId == null) return;
    setDeleting(true);
    try {
      await announcementService.remove(confirmDeleteId);
      toast(true, 'Announcement deleted.', setToastMsg);
      setConfirmDeleteId(null);
      await load();
    } catch (e: unknown) {
      toast(false, e instanceof Error ? e.message : 'Delete failed.', setToastMsg);
    } finally {
      setDeleting(false);
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
            <Megaphone size={20} className="text-[#0078D7]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Announcements</h1>
            <p className="text-sm text-gray-500">{filtered.length} shown</p>
          </div>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={openCreate}>
          New announcement
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] px-4 py-3 space-y-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, ID, community..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200
              focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Title', 'Target', 'Status', 'Publish at', 'Updated', 'Actions'].map((h) => (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    No announcements found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{r.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.title}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.communityName || r.areaName || 'All members'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {r.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.publishAt ? new Date(r.publishAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(r.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(r.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0078D7] hover:underline"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(r.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === 'create' ? 'New announcement' : 'Edit announcement'}
        size="lg"
        footer={(
          <div className="flex justify-end gap-2 w-full">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" loading={saving} onClick={handleSave}>
              {mode === 'create' ? 'Create' : 'Save changes'}
            </Button>
          </div>
        )}
      >
        <div className="space-y-4 max-h-[70svh] overflow-y-auto pr-1">
          <label className="block text-xs font-semibold text-gray-500">
            Title *
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
            />
          </label>

          <label className="block text-xs font-semibold text-gray-500">
            Message *
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={6}
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-500">
              Target community (optional)
              <select
                value={form.communityId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, communityId: e.target.value ? Number(e.target.value) : undefined }))}
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
              >
                <option value="">All members</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-gray-500">
              Publish at (optional)
              <input
                type="datetime-local"
                value={form.publishAt ? new Date(form.publishAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setForm((f) => ({ ...f, publishAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="rounded border-gray-300 text-[#0078D7] focus:ring-[#0078D7]"
            />
            <span className="text-sm text-gray-700">Published (visible to members)</span>
          </label>

          {/* Placeholder for future area targeting once a tenant-scoped areas list API is available */}
          {areas.length > 0 ? null : (
            <p className="text-xs text-gray-400">
              Targeting by area will be enabled once we add a tenant-scoped “list areas” API. Community targeting works now.
            </p>
          )}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete announcement"
        description="This will permanently remove the announcement."
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
      />
    </div>
  );
}

