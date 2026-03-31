import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Clock, Layers,
  CheckCircle2, XCircle, ChevronDown, X, Link, Unlink, Search,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { facilityService, type FacilityOperatingHours } from '../../services/facilityService';
import { venueService, type VenueListItem } from '../../services/venueService';
import { activityService } from '../../services/activityService';
import { getCountries, getCities, getAreas, getCommunities } from '../../services/locationService';
import type { Country, City, Area, Community, Facility, Activity } from '../../types';
import Button   from '../../components/ui/Button';
import Spinner  from '../../components/ui/Spinner';
import { ConfirmModal } from '../../components/ui/Modal';

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_OPTIONS = [30, 60, 90, 120];

// â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Toast({ ok, msg, onClose }: { ok: boolean; msg: string; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white
      ${ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">âœ•</button>
    </div>
  );
}

// â”€â”€ Tab component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Tabs({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="flex border-b border-gray-200 mb-4">
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => onChange(i)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
            ${active === i
              ? 'border-[#0078D7] text-[#0078D7]'
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// â”€â”€ Drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface DrawerProps {
  facility: Facility | null;
  venues: VenueListItem[];
  onClose: () => void;
  onSaved: () => void;
  showToast: (ok: boolean, msg: string) => void;
}

function FacilityDrawer({ facility, venues, onClose, onSaved, showToast }: DrawerProps) {
  const isEdit = facility !== null;
  const [activeTab, setActiveTab] = useState(0);

  // â”€â”€ Details form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [form, setForm] = useState({
    name: facility?.name ?? '',
    location: facility?.location ?? '',
    capacity: facility?.capacity ?? 10,
    venueId: facility?.venueId ?? (venues[0]?.id ?? null as number | null),
    code: facility?.code ?? '',
    shortDescription: facility?.shortDescription ?? '',
    description: facility?.description ?? '',
    requiresApproval: facility?.requiresApproval ?? false,
    isActive: facility?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  async function saveDetails() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        location: form.location,
        capacity: Number(form.capacity),
        venueId: form.venueId ?? undefined,
        code: form.code || undefined,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        requiresApproval: form.requiresApproval,
        isActive: form.isActive,
        slotDurationMinutes: facility?.slotDurationMinutes ?? 60,
        maxConsecutiveSlots: facility?.maxConsecutiveSlots ?? 3,
      };
      if (isEdit) {
        await facilityService.update(facility!.id, { ...payload, id: facility!.id });
        showToast(true, `"${form.name}" updated.`);
      } else {
        await facilityService.create(payload);
        showToast(true, `"${form.name}" created.`);
      }
      onSaved();
      if (!isEdit) onClose();
    } catch {
      showToast(false, 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // â”€â”€ Slot config state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [slotDuration, setSlotDuration]    = useState(facility?.slotDurationMinutes ?? 60);
  const [maxSlots,     setMaxSlots]        = useState(facility?.maxConsecutiveSlots ?? 3);
  const [savingSlot,   setSavingSlot]      = useState(false);

  async function saveSlotConfig() {
    if (!facility) return;
    setSavingSlot(true);
    try {
      await facilityService.setSlotConfig(facility.id, {
        slotDurationMinutes: slotDuration,
        maxConsecutiveSlots: maxSlots,
      });
      showToast(true, 'Slot configuration saved.');
      onSaved();
    } catch {
      showToast(false, 'Failed to save slot configuration.');
    } finally {
      setSavingSlot(false);
    }
  }

  // â”€â”€ Activities state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [allActivities,    setAllActivities]    = useState<Activity[]>([]);
  const [linkedIds,        setLinkedIds]        = useState<number[]>(
    facility?.facilityActivities?.map(fa => fa.activityId) ?? []
  );
  const [selectedActivity, setSelectedActivity] = useState<number | ''>('');
  const [linkingActivity,  setLinkingActivity]  = useState(false);

  useEffect(() => {
    if (activeTab === 2) {
      activityService.getAll().then(setAllActivities).catch(() => {});
    }
  }, [activeTab]);

  async function handleLinkActivity() {
    if (!facility || !selectedActivity) return;
    setLinkingActivity(true);
    try {
      await facilityService.linkActivity(facility.id, Number(selectedActivity));
      setLinkedIds(ids => [...ids, Number(selectedActivity)]);
      setSelectedActivity('');
      showToast(true, 'Activity linked.');
    } catch {
      showToast(false, 'Failed to link activity.');
    } finally {
      setLinkingActivity(false);
    }
  }

  async function handleUnlinkActivity(activityId: number) {
    if (!facility) return;
    try {
      await facilityService.unlinkActivity(facility.id, activityId);
      setLinkedIds(ids => ids.filter(id => id !== activityId));
      showToast(true, 'Activity removed.');
    } catch {
      showToast(false, 'Failed to remove activity.');
    }
  }

  const linkedActivities = allActivities.filter(a => linkedIds.includes(a.id));
  const unlinkableActivities = allActivities.filter(a => !linkedIds.includes(a.id));

  // â”€â”€ Operating hours state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [hours, setHours] = useState<FacilityOperatingHours[]>(
    Array.from({ length: 7 }, (_, i) => ({
      id: 0, dayOfWeek: i, openTime: '08:00', closeTime: '22:00', isClosed: false,
    }))
  );
  const [loadingHours, setLoadingHours] = useState(false);
  const [savingHours,  setSavingHours]  = useState(false);

  useEffect(() => {
    if (activeTab === 3 && facility) {
      setLoadingHours(true);
      facilityService.getHours(facility.id)
        .then(data => {
          if (data.length > 0) {
            setHours(prev => prev.map(h => {
              const saved = data.find(d => d.dayOfWeek === h.dayOfWeek);
              return saved ?? h;
            }));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingHours(false));
    }
  }, [activeTab, facility]);

  function updateHour(day: number, field: keyof FacilityOperatingHours, val: unknown) {
    setHours(h => h.map(r => r.dayOfWeek === day ? { ...r, [field]: val } : r));
  }

  async function saveHours() {
    if (!facility) return;
    setSavingHours(true);
    try {
      await facilityService.setHours(facility.id, hours);
      showToast(true, 'Operating hours saved.');
    } catch {
      showToast(false, 'Failed to save hours.');
    } finally {
      setSavingHours(false);
    }
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const tabs = isEdit
    ? ['Details', 'Slot Config', 'Activities', 'Operating Hours']
    : ['Details'];

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-[#0078D7]" />
          <h2 className="font-semibold text-gray-800">
            {isEdit ? `Edit: ${facility!.name}` : 'New Facility'}
          </h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">

        {/* â”€â”€ Details â”€â”€ */}
        {activeTab === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Badminton Court 1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  placeholder="e.g. Ground Floor, Block A"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Capacity *</label>
                <input
                  type="number" min={1}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  value={form.capacity}
                  onChange={e => set('capacity', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Venue</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  value={form.venueId ?? ''}
                  onChange={e => set('venueId', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">- none -</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  value={form.code}
                  onChange={e => set('code', e.target.value)}
                  placeholder="e.g. BC-01"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Short Description</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  value={form.shortDescription}
                  onChange={e => set('shortDescription', e.target.value)}
                  placeholder="One-line summary shown in listings"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 resize-none"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Full details about this facility..."
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-[#0078D7]"
                  checked={form.isActive}
                  onChange={e => set('isActive', e.target.checked)}
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-[#0078D7]"
                  checked={form.requiresApproval}
                  onChange={e => set('requiresApproval', e.target.checked)}
                />
                <span className="text-sm text-gray-700">Requires Organizer Approval</span>
              </label>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="primary" size="sm"
                onClick={saveDetails}
                disabled={!form.name.trim() || !form.location.trim() || saving}
              >
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Facility'}
              </Button>
            </div>
          </div>
        )}

        {/* â”€â”€ Slot Config â”€â”€ */}
        {activeTab === 1 && facility && (
          <div className="space-y-6">
            <div className="bg-[#e6f3fc] rounded-xl p-4 text-sm text-[#025DB6]">
              Configure how time slots work for this facility. Slot duration controls block size; max consecutive limits fair usage.
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Slot Duration</label>
              <div className="flex gap-2 flex-wrap">
                {SLOT_OPTIONS.map(m => (
                  <button
                    key={m}
                    onClick={() => setSlotDuration(m)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                      ${slotDuration === m
                        ? 'bg-[#0078D7] text-white border-[#0078D7]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#66b7ed]'}`}
                  >
                    {m < 60 ? `${m} min` : `${m / 60} hr`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Max Consecutive Slots <span className="text-gray-400">(fair-usage limit per booking)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => setMaxSlots(n)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium border transition-colors
                      ${maxSlots === n
                        ? 'bg-[#0078D7] text-white border-[#0078D7]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#66b7ed]'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Max booking = {maxSlots} x {slotDuration < 60 ? `${slotDuration} min` : `${slotDuration / 60} hr`} = {maxSlots * slotDuration} min
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={saveSlotConfig} disabled={savingSlot}>
                {savingSlot ? 'Saving...' : 'Save Slot Config'}
              </Button>
            </div>
          </div>
        )}

        {/* â”€â”€ Activities â”€â”€ */}
        {activeTab === 2 && facility && (
          <div className="space-y-4">
            {/* Linked */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Linked Activities
              </p>
              {linkedActivities.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4 text-center">No activities linked yet.</p>
              ) : (
                <div className="space-y-1">
                  {linkedActivities.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-[#66b7ed]" />
                        <span className="text-sm text-gray-700">{a.name}</span>
                        {a.category && (
                          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">{a.category}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnlinkActivity(a.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove"
                      >
                        <Unlink size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add activity */}
            {unlinkableActivities.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Add Activity
                </p>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                    value={selectedActivity}
                    onChange={e => setSelectedActivity(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">- choose activity -</option>
                    {unlinkableActivities.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <Button
                    variant="primary" size="sm"
                    onClick={handleLinkActivity}
                    disabled={!selectedActivity || linkingActivity}
                    className="flex items-center gap-1"
                  >
                    <Link size={13} /> Link
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* â”€â”€ Operating Hours â”€â”€ */}
        {activeTab === 3 && facility && (
          <div className="space-y-3">
            {loadingHours ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <>
                <div className="text-xs text-gray-400 mb-1">
                  Set opening hours for each day. Closed days are excluded from slot generation.
                </div>
                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-2 text-left">Day</th>
                        <th className="px-4 py-2 text-left">Open</th>
                        <th className="px-4 py-2 text-left">Close</th>
                        <th className="px-4 py-2 text-center">Closed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {hours.map(h => (
                        <tr key={h.dayOfWeek} className={h.isClosed ? 'opacity-50' : ''}>
                          <td className="px-4 py-2 font-medium text-gray-700 w-28">
                            {DAY_NAMES[h.dayOfWeek]}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="time"
                              className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#0078D7]/30"
                              value={h.openTime.slice(0, 5)}
                              disabled={h.isClosed}
                              onChange={e => updateHour(h.dayOfWeek, 'openTime', e.target.value + ':00')}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="time"
                              className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#0078D7]/30"
                              value={h.closeTime.slice(0, 5)}
                              disabled={h.isClosed}
                              onChange={e => updateHour(h.dayOfWeek, 'closeTime', e.target.value + ':00')}
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded accent-red-500"
                              checked={h.isClosed}
                              onChange={e => updateHour(h.dayOfWeek, 'isClosed', e.target.checked)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end pt-1">
                  <Button variant="primary" size="sm" onClick={saveHours} disabled={savingHours}>
                    {savingHours ? 'Saving...' : 'Save Hours'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ManageFacilitiesPage() {
  const [venues,      setVenues]      = useState<VenueListItem[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [facilities,  setFacilities]  = useState<Facility[]>([]);
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(false);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Location cascade
  const [countries,          setCountries]          = useState<Country[]>([]);
  const [cities,             setCities]             = useState<City[]>([]);
  const [areas,              setAreas]              = useState<Area[]>([]);
  const [locationCommunities, setLocationCommunities] = useState<Community[]>([]);
  const [selCountry,  setSelCountry]  = useState<number | ''>('');
  const [selCity,     setSelCity]     = useState<number | ''>('');
  const [selArea,     setSelArea]     = useState<number | ''>('');
  const [selCommunity, setSelCommunity] = useState<number | ''>('');

  const [drawerFacility, setDrawerFacility] = useState<Facility | null | 'new'>('new' as unknown as null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [deleteId,       setDeleteId]       = useState<number | null>(null);
  const [deleting,       setDeleting]       = useState(false);
  const [toast,          setToast]          = useState<{ ok: boolean; msg: string } | null>(null);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  // Location cascade effects
  useEffect(() => { getCountries().then(setCountries).catch(() => {}); }, []);
  useEffect(() => {
    setCities([]); setAreas([]); setLocationCommunities([]);
    setSelCity(''); setSelArea(''); setSelCommunity('');
    if (selCountry) getCities(Number(selCountry)).then(setCities).catch(() => {});
  }, [selCountry]);
  useEffect(() => {
    setAreas([]); setLocationCommunities([]);
    setSelArea(''); setSelCommunity('');
    if (selCity) getAreas(Number(selCity)).then(setAreas).catch(() => {});
  }, [selCity]);
  useEffect(() => {
    setLocationCommunities([]); setSelCommunity('');
    if (selArea) getCommunities(Number(selArea)).then(setLocationCommunities).catch(() => {});
  }, [selArea]);

  // Load venues - re-fetch when community changes
  const loadVenuesList = useCallback(async (communityId?: number) => {
    setLoadingVenues(true);
    try {
      const data = await venueService.list({ activeOnly: false, communityId });
      const list = Array.isArray(data) ? data : (data as { data?: VenueListItem[] })?.data ?? [];
      setVenues(list);
      if (list.length > 0) setSelectedVenueId(list[0].id);
      else setSelectedVenueId(null);
    } catch {
      showToast(false, 'Failed to load venues.');
    } finally {
      setLoadingVenues(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { loadVenuesList(); }, []); // eslint-disable-line

  // Re-fetch venues when community changes
  useEffect(() => {
    if (selCommunity !== '') {
      loadVenuesList(Number(selCommunity));
    } else {
      loadVenuesList();
    }
    setPage(1);
  }, [selCommunity]); // eslint-disable-line

  // Load facilities when venue changes
  const loadFacilities = useCallback(async (venueId: number | null) => {
    if (!venueId) { setFacilities([]); return; }
    setLoading(true);
    try {
      const data = await facilityService.getAll({ venueId });
      setFacilities(Array.isArray(data) ? data : []);
    } catch {
      showToast(false, 'Failed to load facilities.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacilities(selectedVenueId);
  }, [selectedVenueId, loadFacilities]);

  function openNew() {
    setDrawerFacility(null);
    setDrawerOpen(true);
  }

  function openEdit(f: Facility) {
    setDrawerFacility(f);
    setDrawerOpen(true);
  }

  async function handleDelete() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await facilityService.remove(deleteId);
      showToast(true, 'Facility deleted.');
      setDeleteId(null);
      await loadFacilities(selectedVenueId);
    } catch {
      showToast(false, 'Delete failed. The facility may have existing bookings.');
    } finally {
      setDeleting(false);
    }
  }

  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  if (loadingVenues) return <Spinner fullPage />;

  return (
    <div className="w-[80%] mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="text-[#0078D7]" size={20} />
          <h1 className="text-xl font-semibold text-gray-800">Facilities</h1>
        </div>
        <Button variant="primary" size="sm" onClick={openNew} className="flex items-center gap-1.5">
          <Plus size={15} /> New Facility
        </Button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] px-4 py-3 space-y-3">
        {/* Row 1: venue selector + name search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-sm text-gray-500 whitespace-nowrap">Venue</label>
            <div className="relative">
              <select className="appearance-none border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                value={selectedVenueId ?? ''}
                onChange={e => { setSelectedVenueId(e.target.value ? Number(e.target.value) : null); setSearch(''); setPage(1); }}>
                <option value="">All venues</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search facility name..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7]" />
          </div>
        </div>
        {/* Row 2: location cascade */}
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Filter by location:</span>
          <select value={selCountry} onChange={e => setSelCountry(e.target.value ? Number(e.target.value) : '')}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20">
            <option value="">All Countries</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selCountry && (
            <select value={selCity} onChange={e => setSelCity(e.target.value ? Number(e.target.value) : '')}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20">
              <option value="">All Cities</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {selCity && (
            <select value={selArea} onChange={e => setSelArea(e.target.value ? Number(e.target.value) : '')}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20">
              <option value="">All Areas</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          {selArea && (
            <select value={selCommunity} onChange={e => setSelCommunity(e.target.value ? Number(e.target.value) : '')}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20">
              <option value="">All Communities</option>
              {locationCommunities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {(selCountry || selCity || selArea || selCommunity || search) && (
            <button onClick={() => {
              setSelCountry(''); setSelCity(''); setSelArea(''); setSelCommunity('');
              setSearch(''); setPage(1);
            }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
          )}
        </div>
      </div>

      {/* Facilities table */}
      {loading ? (
        <Spinner fullPage />
      ) : (() => {
        const filteredF = facilities.filter(f =>
          !search || f.name.toLowerCase().includes(search.toLowerCase())
        );
        const totalPagesF = Math.ceil(filteredF.length / pageSize);
        const pagedF = filteredF.slice((page - 1) * pageSize, page * pageSize);
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-medium text-gray-700">
                {filteredF.length} facilit{filteredF.length !== 1 ? 'ies' : 'y'}
                {selectedVenue ? <span className="text-gray-400"> in {selectedVenue.name}</span> : ''}
                {search ? <span className="text-gray-400"> matching "{search}"</span> : ''}
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

            {filteredF.length === 0 ? (
              <div className="py-16 text-center">
                <Building2 size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-400 text-sm">No facilities found.</p>
                <button onClick={openNew} className="mt-3 text-sm text-[#0078D7] hover:underline">
                  Add the first facility
                </button>
              </div>
            ) : (
              <>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-medium">Name</th>
                      <th className="px-5 py-3 text-left font-medium">Location</th>
                      <th className="px-5 py-3 text-center font-medium">Capacity</th>
                      <th className="px-5 py-3 text-center font-medium">Slot</th>
                      <th className="px-5 py-3 text-center font-medium">Max Slots</th>
                      <th className="px-5 py-3 text-center font-medium">Approval</th>
                      <th className="px-5 py-3 text-center font-medium">Active</th>
                      <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedF.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{f.name}</td>
                        <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{f.location}</td>
                        <td className="px-5 py-3 text-center text-gray-600">{f.capacity}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            <Clock size={12} className="text-gray-400" />
                            {f.slotDurationMinutes ?? 60}m
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center text-gray-600">{f.maxConsecutiveSlots ?? 3}</td>
                        <td className="px-5 py-3 text-center">
                          {f.requiresApproval
                            ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Required</span>
                            : <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Auto</span>}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {f.isActive
                            ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                            : <XCircle size={16} className="text-gray-300 mx-auto" />}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => openEdit(f)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#0078D7] hover:bg-[#e6f3fc] transition-colors" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteId(f.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPagesF > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                    <span className="text-xs text-gray-400">Page {page} of {totalPagesF}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                        <ChevronLeft size={13} />
                      </button>
                      {Array.from({ length: Math.min(5, totalPagesF) }, (_, i) => {
                        const start = Math.max(1, Math.min(page - 2, totalPagesF - 4));
                        const pg = start + i;
                        return (
                          <button key={pg} onClick={() => setPage(pg)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                              pg === page ? 'bg-[#0078D7] text-white border-[#0078D7]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}>{pg}</button>
                        );
                      })}
                      <button onClick={() => setPage(p => Math.min(totalPagesF, p + 1))} disabled={page === totalPagesF}
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

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setDrawerOpen(false)} />
          <FacilityDrawer
            facility={drawerFacility as Facility | null}
            venues={venues}
            onClose={() => setDrawerOpen(false)}
            onSaved={() => loadFacilities(selectedVenueId)}
            showToast={showToast}
          />
        </>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Facility"
        description="Are you sure? This cannot be undone. Existing bookings must be cancelled first."
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


