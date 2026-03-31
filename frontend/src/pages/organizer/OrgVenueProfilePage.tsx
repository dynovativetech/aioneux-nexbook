import { useState, useEffect, useRef } from 'react';
import {
  Building2, Image, Upload, Trash2, CheckCircle2,
} from 'lucide-react';
import { venueService, type VenueListItem, type VenueImageItem, type VenueOperatingHours } from '../../services/venueService';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAME_TO_IDX: Record<string, number> = Object.fromEntries(DAY_NAMES.map((d, i) => [d, i]));

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
    <div className="flex border-b border-gray-200 mb-5">
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => onChange(i)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
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

// â”€â”€ Images Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ImagesTab({ venueId, showToast }: { venueId: number; showToast: (ok: boolean, msg: string) => void }) {
  const [images,    setImages]    = useState<VenueImageItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await venueService.get(venueId);
      setImages(data.images ?? []);
    } catch { showToast(false, 'Failed to load images.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [venueId]); // eslint-disable-line

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await venueService.uploadImage(venueId, file);
      showToast(true, 'Image uploaded.');
      await load();
    } catch { showToast(false, 'Upload failed.'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await venueService.uploadLogo(venueId, file);
      showToast(true, 'Logo updated.');
    } catch { showToast(false, 'Logo upload failed.'); }
    finally { setUploading(false); }
  }

  async function handleDelete(imageId: number) {
    try {
      await venueService.deleteImage(venueId, imageId);
      showToast(true, 'Image removed.');
      await load();
    } catch { showToast(false, 'Failed to delete image.'); }
  }

  if (loading) return <div className="py-8 flex justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {/* Logo upload */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Venue Logo</p>
        <label className="inline-flex items-center gap-2 cursor-pointer bg-white border border-gray-200 hover:border-[#66b7ed] rounded-xl px-4 py-2.5 text-sm text-gray-600 transition-colors">
          <Upload size={14} className="text-[#0087e0]" />
          {uploading ? 'Uploadingâ€¦' : 'Upload Logo'}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
        </label>
      </div>

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gallery</p>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-[#0078D7] hover:underline">
            <Upload size={12} /> Add Photo
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {images.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
            <Image size={24} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No gallery images yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map(img => (
              <div key={img.id} className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                <img src={img.url} alt={img.caption ?? ''} className="w-full h-32 object-cover" />
                {img.isPrimary && (
                  <div className="absolute top-2 left-2 bg-[#0078D7] text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={9} /> Primary
                  </div>
                )}
                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 size={11} />
                </button>
                {img.caption && (
                  <div className="px-2 py-1 text-xs text-gray-500 truncate">{img.caption}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€ Operating Hours Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function HoursTab({ venueId, showToast }: { venueId: number; showToast: (ok: boolean, msg: string) => void }) {
  const [hours,   setHours]   = useState<VenueOperatingHours[]>(
    Array.from({ length: 7 }, (_, i) => ({
      id: 0, dayOfWeek: i, openTime: '08:00', closeTime: '22:00', isClosed: false,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    setLoading(true);
    venueService.getHours(venueId)
      .then(data => {
        if (data.length > 0) {
          // Normalise API string dayOfWeek ("Monday") → numeric index (1)
          const normalised = data.map(d => ({
            ...d,
            dayOfWeek: typeof d.dayOfWeek === 'string'
              ? (DAY_NAME_TO_IDX[d.dayOfWeek] ?? d.dayOfWeek)
              : d.dayOfWeek,
          }));
          setHours(prev => prev.map(h => {
            const saved = normalised.find(d => d.dayOfWeek === h.dayOfWeek);
            return saved ?? h;
          }));
        }
      })
      .catch(() => showToast(false, 'Failed to load hours.'))
      .finally(() => setLoading(false));
  }, [venueId]); // eslint-disable-line

  function update(day: number | string, field: keyof VenueOperatingHours, val: unknown) {
    setHours(h => h.map(r => r.dayOfWeek === day ? { ...r, [field]: val } : r));
  }

  async function save() {
    setSaving(true);
    try {
      await venueService.setHours(venueId, hours);
      showToast(true, 'Operating hours saved.');
    } catch { showToast(false, 'Failed to save hours.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="py-8 flex justify-center"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">Set your venue's opening hours for each day of the week.</p>
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
                <td className="px-4 py-2.5 font-medium text-gray-700 w-28">{DAY_NAMES[h.dayOfWeek as number] ?? h.dayOfWeek}</td>
                <td className="px-4 py-2.5">
                  <input
                    type="time"
                    className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#0078D7]/30"
                    value={h.openTime.slice(0, 5)}
                    disabled={h.isClosed}
                    onChange={e => update(h.dayOfWeek, 'openTime', e.target.value + ':00')}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="time"
                    className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#0078D7]/30"
                    value={h.closeTime.slice(0, 5)}
                    disabled={h.isClosed}
                    onChange={e => update(h.dayOfWeek, 'closeTime', e.target.value + ':00')}
                  />
                </td>
                <td className="px-4 py-2.5 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-red-500"
                    checked={h.isClosed}
                    onChange={e => update(h.dayOfWeek, 'isClosed', e.target.checked)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={save} disabled={saving}>
          {saving ? 'Savingâ€¦' : 'Save Hours'}
        </Button>
      </div>
    </div>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function OrgVenueProfilePage() {
  const [venues,          setVenues]          = useState<VenueListItem[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState(0);
  const [toast,           setToast]           = useState<{ ok: boolean; msg: string } | null>(null);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    setLoading(true);
    venueService.getMyVenues()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setVenues(list);
        if (list.length > 0) setSelectedVenueId(list[0].id);
      })
      .catch(() => showToast(false, 'Failed to load venues.'))
      .finally(() => setLoading(false));
  }, []);

  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  if (loading) return <Spinner fullPage />;

  return (
    <div className="w-[80%] mx-auto space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Venue Profile</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage images and operating hours for your assigned venues</p>
      </div>

      {/* Venue selector */}
      {venues.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {venues.map(v => (
            <button
              key={v.id}
              onClick={() => { setSelectedVenueId(v.id); setActiveTab(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${selectedVenueId === v.id
                  ? 'bg-[#0078D7] border-[#0078D7] text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#66b7ed]'}`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {!selectedVenueId || venues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Building2 size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm">No venues assigned to you yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {/* Venue name banner */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-[#e6f3fc] rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-[#0078D7]" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{selectedVenue?.name}</p>
              <p className="text-xs text-gray-500">{selectedVenue?.communityName}</p>
            </div>
          </div>

          <Tabs
            tabs={['Images', 'Operating Hours']}
            active={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === 0 && (
            <ImagesTab venueId={selectedVenueId} showToast={showToast} />
          )}
          {activeTab === 1 && (
            <HoursTab venueId={selectedVenueId} showToast={showToast} />
          )}
        </div>
      )}

      {toast && <Toast ok={toast.ok} msg={toast.msg} onClose={() => setToast(null)} />}
    </div>
  );
}

