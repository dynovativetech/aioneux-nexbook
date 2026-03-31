import { useState, useEffect, useRef } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Image, Clock, Star,
  Users, X, Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { venueService, type VenueListItem, type VenueDetail, type CreateVenuePayload } from '../../services/venueService';
import { locationService, getCountries, getCities, getAreas, getCommunities } from '../../services/locationService';
import type { Country, City, Area, Community } from '../../types';
import Button   from '../../components/ui/Button';
import Spinner  from '../../components/ui/Spinner';
import { ConfirmModal } from '../../components/ui/Modal';

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const AMENITY_LABELS: Record<number, string> = {
  0: 'Parking',
  1: 'Indoor AC',
  2: 'Male Washroom',
  3: 'Female Washroom',
  4: 'Disabled Access',
  5: 'Wi-Fi',
  6: 'Change Rooms',
  7: 'Lockers',
  8: 'Cafeteria',
  9: 'First Aid',
};

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function toast(ok: boolean, msg: string, set: (v: {ok:boolean;msg:string}|null)=>void) {
  set({ ok, msg });
  setTimeout(() => set(null), 3500);
}

function emptyForm(): CreateVenuePayload {
  return {
    communityId: 0, name: '', address: '',
    shortDescription: '', description: '',
    latitude: undefined, longitude: undefined,
    googleMapsUrl: '', phone: '', mobile: '', website: '',
    contactPersonName: '', contactPersonEmail: '', contactPersonPhone: '', contactPersonMobile: '',
    isActive: true,
  };
}

type Tab = 'details' | 'images' | 'hours' | 'amenities' | 'organizers';

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ManageVenuesPage() {
  const [venues,    setVenues]    = useState<VenueListItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [toastMsg,  setToastMsg]  = useState<{ok:boolean;msg:string}|null>(null);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<'All' | 'Active' | 'Inactive'>('All');
  const [deleteId,  setDeleteId]  = useState<number|null>(null);
  const [deleting,  setDeleting]  = useState(false);

  // Location cascade filter
  const [countries,          setCountries]          = useState<Country[]>([]);
  const [cities,             setCities]             = useState<City[]>([]);
  const [areas,              setAreas]              = useState<Area[]>([]);
  const [locationCommunities, setLocationCommunities] = useState<Community[]>([]);
  const [selCountry,  setSelCountry]  = useState<number | ''>('');
  const [selCity,     setSelCity]     = useState<number | ''>('');
  const [selArea,     setSelArea]     = useState<number | ''>('');
  const [selCommunity, setSelCommunity] = useState<number | ''>('');

  // Pagination
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Drawer state
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [editingId,    setEditingId]    = useState<number|null>(null);
  const [activeTab,    setActiveTab]    = useState<Tab>('details');
  const [venueDetail,  setVenueDetail]  = useState<VenueDetail|null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load countries on mount
  useEffect(() => { getCountries().then(setCountries).catch(() => {}); }, []);
  // Cascade: country -> cities
  useEffect(() => {
    setCities([]); setAreas([]); setLocationCommunities([]);
    setSelCity(''); setSelArea(''); setSelCommunity('');
    if (selCountry) getCities(Number(selCountry)).then(setCities).catch(() => {});
  }, [selCountry]);
  // Cascade: city -> areas
  useEffect(() => {
    setAreas([]); setLocationCommunities([]);
    setSelArea(''); setSelCommunity('');
    if (selCity) getAreas(Number(selCity)).then(setAreas).catch(() => {});
  }, [selCity]);
  // Cascade: area -> communities
  useEffect(() => {
    setLocationCommunities([]); setSelCommunity('');
    if (selArea) getCommunities(Number(selArea)).then(setLocationCommunities).catch(() => {});
  }, [selArea]);

  const loadVenues = async (communityId?: number) => {
    setLoading(true);
    try {
      const data = await venueService.list({
        communityId: communityId || undefined,
        search: search || undefined,
      });
      setVenues(data);
      setPage(1);
    } catch {
      toast(false, 'Failed to load venues.', setToastMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVenues(); }, []); // eslint-disable-line

  // Re-fetch when community selection changes
  useEffect(() => {
    loadVenues(selCommunity ? Number(selCommunity) : undefined);
  }, [selCommunity]); // eslint-disable-line

  const filtered = venues.filter(v => {
    const q = search.toLowerCase();
    const matchesSearch = !q || v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All'
      || (statusFilter === 'Active' && v.isActive)
      || (statusFilter === 'Inactive' && !v.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const activeLocFilter = !!(selCountry || selCity || selArea || selCommunity);

  async function openNew() {
    setEditingId(null);
    setVenueDetail(null);
    setActiveTab('details');
    setDrawerOpen(true);
  }

  async function openEdit(id: number) {
    setEditingId(id);
    setActiveTab('details');
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await venueService.get(id);
      setVenueDetail(detail);
    } catch {
      toast(false, 'Failed to load venue details.', setToastMsg);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await venueService.remove(deleteId);
      toast(true, 'Venue deleted.', setToastMsg);
      setDeleteId(null);
      loadVenues();
    } catch {
      toast(false, 'Delete failed. The venue may have linked facilities.', setToastMsg);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Spinner fullPage />;

  return (
    <div className="w-[80%] mx-auto space-y-5">
      {toastMsg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${
          toastMsg.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'}`}>
          {toastMsg.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#cce7f9] rounded-lg">
            <Building2 size={20} className="text-[#0078D7]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Venues</h1>
            <p className="text-sm text-gray-500">{filtered.length} of {venues.length} shown</p>
          </div>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={openNew}>
          Add Venue
        </Button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] px-4 py-3 space-y-3">
        {/* Row 1: Search + status */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or address..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] placeholder:text-gray-400" />
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {(['All', 'Active', 'Inactive'] as const).map(opt => (
              <button key={opt} onClick={() => { setStatusFilter(opt); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  statusFilter === opt ? 'bg-[#0078D7] text-white border-[#0078D7]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>{opt}</button>
            ))}
          </div>
        </div>
        {/* Row 2: Location cascade */}
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
          {(search || statusFilter !== 'All' || activeLocFilter) && (
            <button onClick={() => {
              setSearch(''); setStatusFilter('All');
              setSelCountry(''); setSelCity(''); setSelArea(''); setSelCommunity('');
              setPage(1);
            }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            {filtered.length} venue{filtered.length !== 1 ? 's' : ''}
            {filtered.length < venues.length && <span className="text-gray-400 font-normal"> of {venues.length}</span>}
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
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['', 'Name', 'Community', 'Facilities', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">
                No venues found. Click "Add Venue" to create one.
              </td></tr>
            ) : paged.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="pl-4 py-3 w-12">
                  {v.coverImageUrl
                    ? <img src={v.coverImageUrl} alt={v.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                    : <div className="w-10 h-10 rounded-lg bg-[#e6f3fc] flex items-center justify-center">
                        <Building2 size={16} className="text-[#99cff3]" />
                      </div>}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{v.name}</p>
                  {v.shortDescription && <p className="text-xs text-gray-400 truncate max-w-xs">{v.shortDescription}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">{v.communityName}</td>
                <td className="px-4 py-3 text-gray-600">{v.facilityCount}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    v.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {v.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(v.id)}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs text-[#0078D7] hover:bg-[#e6f3fc] rounded-md transition-colors">
                      <Pencil size={12} /> Manage
                    </button>
                    <button onClick={() => setDeleteId(v.id)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pg = start + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      pg === page ? 'bg-[#0078D7] text-white border-[#0078D7]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>{pg}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer / Sheet */}
      {drawerOpen && (
        <VenueDrawer
          venueId={editingId}
          initialDetail={venueDetail}
          loading={detailLoading}
          onClose={() => { setDrawerOpen(false); loadVenues(); }}
          showToast={(ok, msg) => toast(ok, msg, setToastMsg)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Venue"
        description="Are you sure you want to delete this venue? This will also delete all linked images, hours, amenities and organizer assignments."
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
      />
    </div>
  );
}

// â”€â”€ Drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface DrawerProps {
  venueId: number | null;
  initialDetail: VenueDetail | null;
  loading: boolean;
  onClose: () => void;
  showToast: (ok: boolean, msg: string) => void;
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
}

function VenueDrawer({ venueId: initialVenueId, initialDetail, loading, onClose, showToast, activeTab, onTabChange }: DrawerProps) {
  const [currentId, setCurrentId] = useState<number | null>(initialVenueId);
  const [detail,    setDetail]    = useState<VenueDetail | null>(initialDetail);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { setDetail(initialDetail); setCurrentId(initialVenueId); }, [initialDetail, initialVenueId]);

  const refreshDetail = async (id: number) => {
    const d = await venueService.get(id);
    setDetail(d);
  };

  async function handleCreated(newId: number) {
    setCurrentId(newId);
    const d = await venueService.get(newId);
    setDetail(d);
    onTabChange('images');
    showToast(true, 'Venue created! Now upload your logo and gallery images.');
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'details',    label: 'Details',    icon: <Building2 size={14}/> },
    { key: 'images',     label: 'Images',     icon: <Image size={14}/> },
    { key: 'hours',      label: 'Hours',      icon: <Clock size={14}/> },
    { key: 'amenities',  label: 'Amenities',  icon: <Star size={14}/> },
    { key: 'organizers', label: 'Organizers', icon: <Users size={14}/> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-800">
            {currentId ? 'Manage Venue' : 'Add New Venue'}
          </h2>
          {currentId && (
            <span className="text-xs text-gray-400 font-mono">ID #{currentId}</span>
          )}
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0 overflow-x-auto">
          {tabs.map((t, idx) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              disabled={!currentId && t.key !== 'details'}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap disabled:opacity-40
                ${activeTab === t.key
                  ? 'border-[#0078D7] text-[#0078D7]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center flex-shrink-0 font-semibold
                ${activeTab === t.key ? 'bg-[#0078D7] text-white' : 'bg-gray-100 text-gray-500'}`}>
                {idx + 1}
              </span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Spinner />
            </div>
          ) : (
            <>
              {activeTab === 'details' && (
                <DetailsTab
                  venueId={currentId}
                  detail={detail}
                  saving={saving}
                  setSaving={setSaving}
                  showToast={showToast}
                  onSaved={(d) => setDetail(d)}
                  onCreated={handleCreated}
                />
              )}
              {activeTab === 'images' && currentId && (
                <ImagesTab
                  venueId={currentId}
                  images={detail?.images ?? []}
                  logoUrl={detail?.logoUrl}
                  showToast={showToast}
                  onRefresh={() => refreshDetail(currentId)}
                  onNext={() => onTabChange('hours')}
                />
              )}
              {activeTab === 'hours' && currentId && (
                <HoursTab
                  venueId={currentId}
                  hours={detail?.operatingHours ?? []}
                  showToast={showToast}
                  onSaved={() => refreshDetail(currentId)}
                  onNext={() => onTabChange('amenities')}
                />
              )}
              {activeTab === 'amenities' && currentId && (
                <AmenitiesTab
                  venueId={currentId}
                  amenities={detail?.amenities ?? []}
                  showToast={showToast}
                  onSaved={() => refreshDetail(currentId)}
                  onNext={() => onTabChange('organizers')}
                />
              )}
              {activeTab === 'organizers' && currentId && (
                <OrganizersTab
                  venueId={currentId}
                  organizers={detail?.organizers ?? []}
                  showToast={showToast}
                  onRefresh={() => refreshDetail(currentId)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// â”€â”€ Details Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DetailsTab({ venueId, detail, saving, setSaving, showToast, onSaved, onCreated }: {
  venueId: number | null;
  detail: VenueDetail | null;
  saving: boolean;
  setSaving: (v: boolean) => void;
  showToast: (ok: boolean, msg: string) => void;
  onSaved: (d: VenueDetail) => void;
  onCreated: (newId: number) => void;
}) {
  const [communities, setCommunities] = useState<{id:number;name:string}[]>([]);
  const [form, setForm] = useState<CreateVenuePayload>(detail ? {
    communityId: detail.communityId,
    name: detail.name,
    shortDescription: detail.shortDescription ?? '',
    description: detail.description ?? '',
    address: detail.address,
    latitude: detail.latitude,
    longitude: detail.longitude,
    googleMapsUrl: detail.googleMapsUrl ?? '',
    phone: detail.phone ?? '',
    mobile: detail.mobile ?? '',
    website: detail.website ?? '',
    contactPersonName: detail.contactPersonName ?? '',
    contactPersonEmail: detail.contactPersonEmail ?? '',
    contactPersonPhone: detail.contactPersonPhone ?? '',
    contactPersonMobile: (detail as any).contactPersonMobile ?? '',
    isActive: detail.isActive,
  } : emptyForm());

  useEffect(() => {
    locationService.getCommunities().then(setCommunities).catch(() => {});
  }, []);

  const set = (field: keyof CreateVenuePayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  async function save() {
    if (!form.name.trim() || !form.address.trim() || !form.communityId) {
      showToast(false, 'Name, address and community are required.');
      return;
    }
    setSaving(true);
    try {
      if (venueId) {
        await venueService.update(venueId, form);
        const d = await venueService.get(venueId);
        onSaved(d);
        showToast(true, 'Venue updated.');
      } else {
        const newId = await venueService.create(form);
        onCreated(newId);
      }
    } catch {
      showToast(false, 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Section title="Basic Information">
        <Field label="Community" required>
          <select value={form.communityId} onChange={set('communityId')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30">
            <option value={0}>Select communityâ€¦</option>
            {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Venue Name" required>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Al Quoz Sports Centre"
            className={inputCls} />
        </Field>
        <Field label="Short Description">
          <input value={form.shortDescription ?? ''} onChange={set('shortDescription')}
            placeholder="One-line summary shown on listing cards"
            className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea value={form.description ?? ''} onChange={set('description')} rows={4}
            placeholder="Full description shown on the venue detail page"
            className={inputCls} />
        </Field>
      </Section>

      <Section title="Location">
        <Field label="Street Address" required>
          <input value={form.address} onChange={set('address')} placeholder="e.g. 12 Al Quoz Industrial 3"
            className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude">
            <input type="number" step="any" value={form.latitude ?? ''}
              onChange={e => setForm(p => ({ ...p, latitude: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="25.2048" className={inputCls} />
          </Field>
          <Field label="Longitude">
            <input type="number" step="any" value={form.longitude ?? ''}
              onChange={e => setForm(p => ({ ...p, longitude: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="55.2708" className={inputCls} />
          </Field>
        </div>
        <Field label="Google Maps URL">
          <input value={form.googleMapsUrl ?? ''} onChange={set('googleMapsUrl')}
            placeholder="https://maps.google.com/â€¦" className={inputCls} />
        </Field>
      </Section>

      <Section title="Venue Contact">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone"><input value={form.phone ?? ''} onChange={set('phone')} placeholder="+971 4 xxx xxxx" className={inputCls} /></Field>
          <Field label="Mobile"><input value={form.mobile ?? ''} onChange={set('mobile')} placeholder="+971 5x xxx xxxx" className={inputCls} /></Field>
        </div>
        <Field label="Website"><input value={form.website ?? ''} onChange={set('website')} placeholder="https://venue.com" className={inputCls} /></Field>
      </Section>

      <Section title="Contact Person">
        <Field label="Contact Person Name">
          <input value={form.contactPersonName ?? ''} onChange={set('contactPersonName')} placeholder="Full name" className={inputCls} />
        </Field>
        <Field label="Contact Person Email">
          <input type="email" value={form.contactPersonEmail ?? ''} onChange={set('contactPersonEmail')} placeholder="person@venue.com" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact Person Phone">
            <input value={form.contactPersonPhone ?? ''} onChange={set('contactPersonPhone')} placeholder="+971 4 xxx xxxx" className={inputCls} />
          </Field>
          <Field label="Contact Person Mobile">
            <input value={(form as any).contactPersonMobile ?? ''} onChange={set('contactPersonMobile')} placeholder="+971 5x xxx xxxx" className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Status">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isActive}
            onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-[#0078D7] focus:ring-[#0078D7]/30" />
          <span className="text-sm text-gray-700">Active (visible to customers)</span>
        </label>
      </Section>

      <div className="flex justify-end pt-2">
        <Button variant="primary" loading={saving} onClick={save}>
          {venueId ? 'Save Changes' : 'Create Venue'}
        </Button>
      </div>
    </div>
  );
}

// â”€â”€ Images Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ImagesTab({ venueId, images, logoUrl, showToast, onRefresh, onNext }: {
  venueId: number;
  images: any[];
  logoUrl?: string;
  showToast: (ok: boolean, msg: string) => void;
  onRefresh: () => Promise<void>;
  onNext?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await venueService.uploadImage(venueId, file);
      }
      await onRefresh();
      showToast(true, 'Image(s) uploaded.');
    } catch {
      showToast(false, 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleLogoUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      await venueService.uploadLogo(venueId, files[0]);
      await onRefresh();
      showToast(true, 'Logo uploaded.');
    } catch {
      showToast(false, 'Logo upload failed.');
    } finally {
      setUploading(false);
      if (logoRef.current) logoRef.current.value = '';
    }
  }

  async function deleteImage(imageId: number) {
    try {
      await venueService.deleteImage(venueId, imageId);
      await onRefresh();
      showToast(true, 'Image deleted.');
    } catch {
      showToast(false, 'Delete failed.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Logo</h3>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border-2 border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              : <Building2 size={28} className="text-gray-300" />}
          </div>
          <div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden"
              onChange={e => handleLogoUpload(e.target.files)} />
            <Button variant="secondary" size="sm" onClick={() => logoRef.current?.click()} loading={uploading}>
              {logoUrl ? 'Replace Logo' : 'Upload Logo'}
            </Button>
            <p className="text-xs text-gray-400 mt-1">Square image recommended  -  PNG or JPG</p>
          </div>
        </div>
      </div>

      {/* Gallery section */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Gallery Images</h3>
          <div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handleUpload(e.target.files)} />
            <Button variant="secondary" size="sm" icon={<Plus size={14}/>}
              onClick={() => fileRef.current?.click()} loading={uploading}>
              Add Images
            </Button>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer
            hover:border-[#66b7ed] transition-colors" onClick={() => fileRef.current?.click()}>
            <Image size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">Click to upload gallery images</p>
            <p className="text-xs text-gray-300 mt-1">JPEG, PNG, WebP up to 10 MB each</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {images.map(img => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-100 aspect-video bg-gray-50">
                <img src={img.url} alt={img.caption ?? img.originalFileName}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                {img.isPrimary && (
                  <span className="absolute top-1 left-1 bg-[#0078D7] text-white text-xs px-1.5 py-0.5 rounded">
                    Cover
                  </span>
                )}
                <button
                  onClick={() => deleteImage(img.id)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full
                    opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
              </div>
            ))}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-lg aspect-video flex items-center justify-center cursor-pointer hover:border-[#66b7ed] transition-colors">
              <Plus size={20} className="text-gray-300" />
            </div>
          </div>
        )}
      </div>

      {onNext && (
        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={onNext}>Next: Set Hours â†'</Button>
        </div>
      )}
    </div>
  );
}

// â”€â”€ Hours Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function HoursTab({ venueId, hours, showToast, onSaved, onNext }: {
  venueId: number;
  hours: any[];
  showToast: (ok: boolean, msg: string) => void;
  onSaved: () => Promise<void>;
  onNext?: () => void;
}) {
  const buildRows = (src: any[]) => DAY_NAMES.map((_, i) => {
    const found = src.find(h => h.dayOfWeek === i);
    return found ?? { id: 0, dayOfWeek: i, openTime: '08:00', closeTime: '22:00', isClosed: i === 5 || i === 6 };
  });

  const [rows, setRows] = useState(() => buildRows(hours));
  useEffect(() => { setRows(buildRows(hours)); }, [hours]); // eslint-disable-line

  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await venueService.setHours(venueId, rows);
      await onSaved();
      showToast(true, 'Operating hours saved.');
    } catch {
      showToast(false, 'Failed to save hours.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Set the opening and closing times for each day of the week.</p>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase">Day</th>
              <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase">Opens</th>
              <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase">Closes</th>
              <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase">Closed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={row.dayOfWeek} className={row.isClosed ? 'opacity-50' : ''}>
                <td className="px-4 py-2.5 font-medium text-gray-700">{DAY_NAMES[row.dayOfWeek]}</td>
                <td className="px-4 py-2.5">
                  <input type="time" value={row.openTime} disabled={row.isClosed}
                    onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, openTime: e.target.value } : x))}
                    className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0078D7]/30 disabled:bg-gray-50" />
                </td>
                <td className="px-4 py-2.5">
                  <input type="time" value={row.closeTime} disabled={row.isClosed}
                    onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, closeTime: e.target.value } : x))}
                    className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0078D7]/30 disabled:bg-gray-50" />
                </td>
                <td className="px-4 py-2.5">
                  <input type="checkbox" checked={row.isClosed}
                    onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, isClosed: e.target.checked } : x))}
                    className="w-4 h-4 rounded border-slate-300 text-[#0078D7]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center">
        <Button variant="primary" loading={saving} onClick={save}>Save Hours</Button>
        {onNext && (
          <Button variant="secondary" onClick={onNext}>Next: Amenities â†'</Button>
        )}
      </div>
    </div>
  );
}

// â”€â”€ Amenities Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AmenitiesTab({ venueId, amenities, showToast, onSaved, onNext }: {
  venueId: number;
  amenities: any[];
  showToast: (ok: boolean, msg: string) => void;
  onSaved: () => Promise<void>;
  onNext?: () => void;
}) {
  const buildRows = (src: any[]) =>
    Object.keys(AMENITY_LABELS).map(k => {
      const found = src.find(a => a.amenityType === Number(k));
      return { amenityType: Number(k), isAvailable: found?.isAvailable ?? false, id: found?.id ?? 0, notes: found?.notes ?? '' };
    });

  const [rows, setRows] = useState(() => buildRows(amenities));
  useEffect(() => { setRows(buildRows(amenities)); }, [amenities]); // eslint-disable-line
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await venueService.setAmenities(venueId, rows.filter(r => r.isAvailable));
      await onSaved();
      showToast(true, 'Amenities saved.');
    } catch {
      showToast(false, 'Failed to save amenities.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Select which amenities are available at this venue.</p>
      <div className="grid grid-cols-2 gap-3">
        {rows.map((row, i) => (
          <label key={row.amenityType}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              row.isAvailable ? 'border-[#99cff3] bg-[#e6f3fc]' : 'border-gray-200 hover:border-[#99cff3]'
            }`}>
            <input type="checkbox" checked={row.isAvailable}
              onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, isAvailable: e.target.checked } : x))}
              className="w-4 h-4 rounded border-slate-300 text-[#0078D7]" />
            <span className="text-sm font-medium text-gray-700">{AMENITY_LABELS[row.amenityType]}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <Button variant="primary" loading={saving} onClick={save}>Save Amenities</Button>
        {onNext && (
          <Button variant="secondary" onClick={onNext}>Next: Organizers â†'</Button>
        )}
      </div>
    </div>
  );
}

// â”€â”€ Organizers Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function OrganizersTab({ venueId, organizers, showToast, onRefresh }: {
  venueId: number;
  organizers: any[];
  showToast: (ok: boolean, msg: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [mode,        setMode]       = useState<'list' | 'search' | 'invite'>('list');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<{id:number;fullName:string;email:string;role:string}|null>(null);
  const [searching,   setSearching]  = useState(false);
  const [notFound,    setNotFound]   = useState(false);
  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName,  setInviteName]  = useState('');
  const [inviteResult, setInviteResult] = useState<{userId:number;email:string;tempPassword:string}|null>(null);
  const [saving,      setSaving]     = useState(false);

  async function handleSearch() {
    if (!searchEmail.trim()) return;
    setSearching(true); setNotFound(false); setSearchResult(null);
    try {
      const res = await fetch(`/api/users/search?email=${encodeURIComponent(searchEmail)}&role=FacilityOrganizer`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('bp_token')}` }
      });
      const json = await res.json();
      const list = Array.isArray(json) ? json : [];
      if (list.length > 0) setSearchResult(list[0]);
      else setNotFound(true);
    } catch { setNotFound(true); }
    finally { setSearching(false); }
  }

  async function assignExisting(uid: number) {
    setSaving(true);
    try {
      await venueService.assignOrganizer(venueId, { userId: uid });
      await onRefresh();
      setMode('list'); setSearchResult(null); setSearchEmail('');
      showToast(true, 'Organizer assigned.');
    } catch { showToast(false, 'Failed to assign organizer.'); }
    finally { setSaving(false); }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) { showToast(false, 'Email is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/users/invite-organizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('bp_token')}`,
        },
        body: JSON.stringify({ email: inviteEmail, fullName: inviteName }),
      });
      const json = await res.json();
      if (!json.success) { showToast(false, json.message ?? 'Failed.'); return; }
      const { userId, email, tempPassword } = json.data;
      await venueService.assignOrganizer(venueId, { userId });
      await onRefresh();
      setInviteResult({ userId, email, tempPassword });
      showToast(true, 'Organizer account created and linked.');
    } catch { showToast(false, 'Failed to create organizer.'); }
    finally { setSaving(false); }
  }

  async function remove(uid: number) {
    try {
      await venueService.removeOrganizer(venueId, uid);
      await onRefresh();
      showToast(true, 'Organizer removed.');
    } catch { showToast(false, 'Failed to remove organizer.'); }
  }

  if (inviteResult) return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-emerald-800 mb-2">âœ“ Organizer account created!</p>
        <p className="text-sm text-emerald-700">Share these credentials with the organizer:</p>
        <div className="mt-3 bg-white rounded-lg border border-emerald-100 p-3 font-mono text-sm space-y-1">
          <div><span className="text-gray-500">Email: </span><strong>{inviteResult.email}</strong></div>
          <div><span className="text-gray-500">Password: </span><strong>{inviteResult.tempPassword}</strong></div>
        </div>
        <p className="text-xs text-emerald-600 mt-2">They should change their password after first login.</p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => { setInviteResult(null); setMode('list'); setInviteEmail(''); setInviteName(''); }}>
        Done
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {mode === 'list' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{organizers.length} organizer(s) assigned.</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setMode('search')}>
                Search Existing
              </Button>
              <Button variant="primary" size="sm" icon={<Plus size={14}/>} onClick={() => setMode('invite')}>
                Create & Invite
              </Button>
            </div>
          </div>

          {organizers.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
              <Users size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No organizers assigned yet.</p>
              <p className="text-xs text-gray-300 mt-1">Use "Create & Invite" to set up a new organizer login.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {organizers.map(o => (
                <div key={o.userId}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{o.firstName ? `${o.firstName} ${o.lastName}` : o.userName}</p>
                    <p className="text-xs text-gray-500">{o.officialEmail ?? o.userEmail}</p>
                  </div>
                  <button onClick={() => remove(o.userId)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode === 'search' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Search Existing Organizer</h3>
            <button onClick={() => { setMode('list'); setSearchResult(null); setNotFound(false); }}
              className="text-xs text-gray-400 hover:text-gray-600">â† Back</button>
          </div>
          <p className="text-xs text-gray-500">Search for a user who already has the FacilityOrganizer role.</p>
          <div className="flex gap-2">
            <input value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter email addressâ€¦" className={`${inputCls} flex-1`} />
            <Button variant="primary" size="sm" loading={searching} onClick={handleSearch}>Search</Button>
          </div>
          {notFound && (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              No organizer found with that email.
              <button className="ml-2 text-[#0078D7] font-medium hover:underline"
                onClick={() => { setInviteEmail(searchEmail); setMode('invite'); }}>
                Create a new account instead?
              </button>
            </div>
          )}
          {searchResult && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#cce7f9] bg-[#e6f3fc]">
              <div>
                <p className="text-sm font-medium text-gray-800">{searchResult.fullName}</p>
                <p className="text-xs text-gray-500">{searchResult.email}</p>
              </div>
              <Button variant="primary" size="sm" loading={saving} onClick={() => assignExisting(searchResult.id)}>
                Assign
              </Button>
            </div>
          )}
        </div>
      )}

      {mode === 'invite' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Create Organizer Account</h3>
            <button onClick={() => setMode('list')} className="text-xs text-gray-400 hover:text-gray-600">â† Back</button>
          </div>
          <p className="text-xs text-gray-500">A new account will be created with the FacilityOrganizer role and automatically linked to this venue.</p>
          <Field label="Email" required>
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="organizer@example.com" className={inputCls} />
          </Field>
          <Field label="Full Name">
            <input value={inviteName} onChange={e => setInviteName(e.target.value)}
              placeholder="First and last name" className={inputCls} />
          </Field>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setMode('list')}>Cancel</Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleInvite}>
              Create Account & Assign
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ Shared layout helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const inputCls = `w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 focus:border-transparent`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}


