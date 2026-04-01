import { useEffect, useState, useMemo } from 'react';
import {
  Users, Plus, Search, Pencil, ChevronLeft, ChevronRight, KeyRound, UserX,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import {
  memberService,
  type AdminMember,
  type AdminMemberDetail,
  type CreateMemberPayload,
  type UpdateMemberPayload,
} from '../../services/memberService';
import { locationService } from '../../services/locationService';
import type { Country, City, Area, Community } from '../../types';

const UAE_NAME = 'United Arab Emirates';
const UAE_CODE = 'AE';
const EMIRATES = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah',
];

function toast(ok: boolean, msg: string, set: (v: { ok: boolean; msg: string } | null) => void) {
  set({ ok, msg });
  setTimeout(() => set(null), 4000);
}

export default function ManageMembersPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateMemberPayload & { isActive: boolean }>({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    landlinePhone: '',
    apartmentOrVillaNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    countryName: '',
    emirate: '',
    postalCode: '',
    areaId: 0,
    communityId: 0,
    isActive: true,
  });

  // Location dropdown state
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  const isUae = (() => {
    const c = countries.find((x) => x.id === selectedCountryId);
    if (c?.code?.toUpperCase() === UAE_CODE) return true;
    return form.countryName.trim().toLowerCase() === UAE_NAME.toLowerCase()
      || form.countryName.trim().toUpperCase() === 'UAE';
  })();

  const [passwordModal, setPasswordModal] = useState<{ title: string; password: string } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await memberService.list();
      setMembers(data);
    } catch {
      toast(false, 'Failed to load members.', setToastMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Load countries once
  useEffect(() => {
    locationService.getCountries()
      .then((cs) => setCountries(cs))
      .catch(() => setCountries([]));
  }, []);

  // Load cities when country changes
  useEffect(() => {
    if (!selectedCountryId) { setCities([]); setSelectedCityId(null); return; }
    locationService.getCities(selectedCountryId)
      .then((list) => setCities(list))
      .catch(() => setCities([]));
  }, [selectedCountryId]);

  // Load areas when city changes
  useEffect(() => {
    if (!selectedCityId) { setAreas([]); return; }
    locationService.getAreas(selectedCityId)
      .then((list) => setAreas(list))
      .catch(() => setAreas([]));
  }, [selectedCityId]);

  // Load communities when area changes
  useEffect(() => {
    if (!form.areaId) { setCommunities([]); return; }
    locationService.getCommunities(form.areaId)
      .then((list) => setCommunities(list))
      .catch(() => setCommunities([]));
  }, [form.areaId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchText =
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        String(m.id).includes(q) ||
        (m.phoneNumber && m.phoneNumber.toLowerCase().includes(q)) ||
        (m.city && m.city.toLowerCase().includes(q));
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && m.isActive) ||
        (statusFilter === 'Inactive' && !m.isActive);
      return matchText && matchStatus;
    });
  }, [members, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function openCreate() {
    setModalMode('create');
    setEditingId(null);
    setForm({
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      landlinePhone: '',
      apartmentOrVillaNumber: '',
      streetAddress: '',
      city: '',
      state: '',
      countryName: '',
      emirate: '',
      postalCode: '',
      areaId: 0,
      communityId: 0,
      isActive: true,
    });
    setSelectedCountryId(null);
    setSelectedCityId(null);
    setModalOpen(true);
  }

  async function openEdit(m: AdminMember) {
    setModalMode('edit');
    setEditingId(m.id);
    setModalOpen(true);
    setDetailLoading(true);
    try {
      const d: AdminMemberDetail = await memberService.get(m.id);
      setForm({
        email: d.email,
        firstName: d.firstName ?? '',
        lastName: d.lastName ?? '',
        phoneNumber: d.phoneNumber ?? '',
        landlinePhone: d.landlinePhone ?? '',
        apartmentOrVillaNumber: d.apartmentOrVillaNumber ?? '',
        streetAddress: d.streetAddress ?? '',
        city: d.city ?? '',
        state: d.state ?? '',
        countryName: d.countryName ?? '',
        emirate: d.emirate ?? '',
        postalCode: d.postalCode ?? '',
        areaId: d.areaId ?? 0,
        communityId: d.communityId ?? 0,
        isActive: d.isActive,
      });
      // Best-effort: preselect country by name
      const matchCountry = countries.find((c) => c.name.toLowerCase() === (d.countryName ?? '').toLowerCase());
      setSelectedCountryId(matchCountry?.id ?? null);
      setSelectedCityId(null);
    } catch {
      toast(false, 'Failed to load member.', setToastMsg);
      setModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  // When cities load, auto-select the one matching the stored city text
  useEffect(() => {
    if (!modalOpen) return;
    if (!cities.length) return;
    if (selectedCityId) return;
    if (!form.city.trim()) return;
    const match = cities.find((c) => c.name.toLowerCase() === form.city.trim().toLowerCase());
    if (match) setSelectedCityId(match.id);
  }, [modalOpen, cities, selectedCityId, form.city]);

  async function handleSave() {
    const missing: string[] = [];
    if (!form.firstName.trim()) missing.push('First name');
    if (!form.lastName.trim()) missing.push('Last name');
    if (!form.email.trim()) missing.push('Email');
    if (!form.phoneNumber.trim()) missing.push('Mobile number');
    // phone is optional
    if (!form.streetAddress.trim()) missing.push('Street address');
    if (!form.city.trim()) missing.push('City');
    if (!form.state.trim()) missing.push('State');
    if (!form.countryName.trim()) missing.push('Country');
    if (!form.areaId) missing.push('Area');
    if (!form.communityId) missing.push('Community');
    if (isUae && !form.emirate?.trim()) missing.push('Emirate');

    if (missing.length) {
      toast(false, `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required.`, setToastMsg);
      return;
    }
    setSaving(true);
    try {
      if (modalMode === 'create') {
        const payload: CreateMemberPayload = {
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          landlinePhone: form.landlinePhone?.trim() || undefined,
          apartmentOrVillaNumber: form.apartmentOrVillaNumber?.trim() || undefined,
          streetAddress: form.streetAddress.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          countryName: form.countryName.trim(),
          emirate: form.emirate?.trim() || undefined,
          postalCode: form.postalCode?.trim() || undefined,
          areaId: form.areaId,
          communityId: form.communityId,
        };
        const res = await memberService.create(payload);
        setModalOpen(false);
        await load();
        setPasswordModal({
          title: 'Member created',
          password: res.tempPassword,
        });
        toast(true, 'Member created.', setToastMsg);
      } else if (editingId !== null) {
        const payload: UpdateMemberPayload = {
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          landlinePhone: form.landlinePhone?.trim() || undefined,
          apartmentOrVillaNumber: form.apartmentOrVillaNumber?.trim() || undefined,
          streetAddress: form.streetAddress.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          countryName: form.countryName.trim(),
          emirate: form.emirate?.trim() || undefined,
          postalCode: form.postalCode?.trim() || undefined,
          areaId: form.areaId,
          communityId: form.communityId,
          isActive: form.isActive,
        };
        await memberService.update(editingId, payload);
        setModalOpen(false);
        toast(true, 'Member updated.', setToastMsg);
        await load();
      }
    } catch (e: unknown) {
      toast(false, e instanceof Error ? e.message : 'Save failed.', setToastMsg);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (editingId === null) return;
    setSaving(true);
    try {
      const res = await memberService.resetPassword(editingId);
      setPasswordModal({ title: 'Password reset', password: res.tempPassword });
      toast(true, 'Password reset.', setToastMsg);
    } catch (e: unknown) {
      toast(false, e instanceof Error ? e.message : 'Reset failed.', setToastMsg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await memberService.remove(deleteId);
      setDeleteId(null);
      toast(true, 'Member deactivated.', setToastMsg);
      await load();
      if (modalOpen && editingId === deleteId) setModalOpen(false);
    } catch (e: unknown) {
      toast(false, e instanceof Error ? e.message : 'Failed.', setToastMsg);
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
            <Users size={20} className="text-[#0078D7]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Member Management</h1>
            <p className="text-sm text-gray-500">
              {filtered.length} of {members.length} shown
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={openCreate}>
          Add Member
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] px-4 py-3 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, ID, phone, city..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {(['All', 'Active', 'Inactive'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setStatusFilter(opt);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  statusFilter === opt
                    ? 'bg-[#0078D7] text-white border-[#0078D7]'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-medium text-gray-700">Members</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              {[10, 15, 20, 25, 30, 50].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'ID', 'Name', 'Email', 'Phone', 'City', 'Status', 'Actions'].map((h) => (
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
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                    No members found.
                  </td>
                </tr>
              ) : (
                paged.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{m.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{m.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{m.email}</td>
                    <td className="px-4 py-3 text-gray-500">{m.phoneNumber || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{m.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0078D7] hover:underline"
                      >
                        <Pencil size={12} /> Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
            <span className="text-xs text-gray-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pg = start + i;
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setPage(pg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      pg === page
                        ? 'bg-[#0078D7] text-white border-[#0078D7]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === 'create' ? 'Add member' : 'Manage member'}
        size="lg"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div className="flex flex-wrap gap-2">
              {modalMode === 'edit' && editingId !== null && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<KeyRound size={14} />}
                    loading={saving}
                    onClick={handleResetPassword}
                  >
                    Reset password
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<UserX size={14} />}
                    onClick={() => setDeleteId(editingId)}
                  >
                    Deactivate
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" loading={saving} onClick={handleSave}>
                {modalMode === 'create' ? 'Create' : 'Save changes'}
              </Button>
            </div>
          </div>
        }
      >
        {detailLoading ? (
          <div className="py-12 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4 max-h-[70svh] overflow-y-auto pr-1" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-gray-500">
                First name *
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                Email *
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                Last name *
                <input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                Mobile number *
                <input
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                Phone
                <input
                  value={form.landlinePhone}
                  onChange={(e) => setForm((f) => ({ ...f, landlinePhone: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                Apartment / Villa no.
                <input
                  value={form.apartmentOrVillaNumber ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, apartmentOrVillaNumber: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-500 sm:col-span-2">
                Street address *
                <input
                  value={form.streetAddress}
                  onChange={(e) => setForm((f) => ({ ...f, streetAddress: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                Country *
                <select
                  value={selectedCountryId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setSelectedCountryId(id);
                    const c = countries.find((x) => x.id === id);
                    setForm((f) => ({ ...f, countryName: c?.name ?? '' }));
                    setSelectedCityId(null);
                    setForm((f) => ({ ...f, areaId: 0, communityId: 0 }));
                  }}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                City *
                <select
                  value={selectedCityId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setSelectedCityId(id);
                    const c = cities.find((x) => x.id === id);
                    setForm((f) => ({ ...f, city: c?.name ?? '', areaId: 0, communityId: 0 }));
                  }}
                  disabled={!selectedCountryId}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none disabled:opacity-50"
                >
                  <option value="">{selectedCountryId ? 'Select city' : 'Select country first'}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                State *
                <input
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                Emirate {isUae ? '*' : '(optional)'}
                <select
                  value={form.emirate ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, emirate: e.target.value }))}
                  disabled={!isUae}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none disabled:opacity-50"
                >
                  <option value="">{isUae ? 'Select emirate' : 'Only for UAE'}</option>
                  {EMIRATES.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                Area *
                <select
                  value={form.areaId || ''}
                  onChange={(e) => setForm((f) => ({ ...f, areaId: Number(e.target.value), communityId: 0 }))}
                  disabled={!selectedCityId}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none disabled:opacity-50"
                >
                  <option value="">{selectedCityId ? 'Select area' : 'Select city first'}</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                Community *
                <select
                  value={form.communityId || ''}
                  onChange={(e) => setForm((f) => ({ ...f, communityId: Number(e.target.value) }))}
                  disabled={!form.areaId}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none disabled:opacity-50"
                >
                  <option value="">{form.areaId ? 'Select community' : 'Select area first'}</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                PO Box / Postal code
                <input
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
                />
              </label>
              {modalMode === 'edit' && (
                <label className="flex items-center gap-2 sm:col-span-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-[#0078D7] focus:ring-[#0078D7]"
                  />
                  <span className="text-sm text-gray-700">Account active (member can sign in)</span>
                </label>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeactivate}
        title="Deactivate member"
        description="They will no longer be able to sign in. You can reactivate later from Manage."
        confirmLabel="Deactivate"
        tone="danger"
        loading={deleting}
      />

      <Modal
        isOpen={passwordModal !== null}
        onClose={() => setPasswordModal(null)}
        title={passwordModal?.title ?? 'Temporary password'}
        size="sm"
        footer={
          <Button variant="primary" size="sm" onClick={() => setPasswordModal(null)}>
            Done
          </Button>
        }
      >
        <p className="text-sm text-gray-600 mb-2">Share this password with the member once. They should change it after login.</p>
        <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 font-mono text-sm break-all select-all">
          {passwordModal?.password}
        </div>
      </Modal>
    </div>
  );
}
