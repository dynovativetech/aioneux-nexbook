import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Building2, ChevronRight, Clock,
  SlidersHorizontal, X,
} from 'lucide-react';
import { venueService, type VenueListItem } from '../../services/venueService';
import { getCountries, getCities, getAreas, getCommunities } from '../../services/locationService';
import type { Country, City, Area, Community } from '../../types';
import Spinner from '../../components/ui/Spinner';

function VenueCard({ venue, onClick }: { venue: VenueListItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-[0_8px_24px_-4px_rgb(0_0_0_/_0.10)] hover:border-[#99cff3] hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative h-44 bg-gradient-to-br from-[#e6f3fc] to-gray-100 overflow-hidden">
        {venue.coverImageUrl ? (
          <img
            src={venue.coverImageUrl}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={40} className="text-gray-200" />
          </div>
        )}
        {venue.logoUrl && (
          <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-white shadow-md overflow-hidden border border-white">
            <img src={venue.logoUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {!venue.isActive && (
          <div className="absolute top-3 right-3 bg-gray-700/80 text-white text-xs px-2 py-1 rounded-full">
            Closed
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-800 text-sm leading-tight">{venue.name}</h3>
          <ChevronRight size={14} className="text-gray-300 group-hover:text-[#0078D7] flex-shrink-0 mt-0.5 transition-colors" />
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
          <MapPin size={11} className="text-gray-400" />
          {venue.communityName} · {venue.address}
        </p>
        {venue.shortDescription && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{venue.shortDescription}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#025DB6] font-semibold bg-[#e6f3fc] px-2.5 py-1 rounded-full flex items-center gap-1">
            <Building2 size={10} />
            {venue.facilityCount} facilit{venue.facilityCount === 1 ? 'y' : 'ies'}
          </span>
          {venue.isActive && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
              <Clock size={10} /> Open
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

interface FilterState {
  search:      string;
  countryId:   number | null;
  cityId:      number | null;
  areaId:      number | null;
  communityId: number | null;
}

const EMPTY_FILTER: FilterState = {
  search: '', countryId: null, cityId: null, areaId: null, communityId: null,
};

const SELECT_CLS = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20 focus:border-[#0078D7] transition-all disabled:bg-gray-50 disabled:text-gray-400';

export default function VenueListingPage() {
  const navigate = useNavigate();

  const [venues,      setVenues]      = useState<VenueListItem[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [filter,      setFilter]      = useState<FilterState>(EMPTY_FILTER);
  const [showFilters, setShowFilters] = useState(false);

  const [countries,   setCountries]   = useState<Country[]>([]);
  const [cities,      setCities]      = useState<City[]>([]);
  const [areas,       setAreas]       = useState<Area[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => { getCountries().then(setCountries).catch(() => {}); }, []);

  useEffect(() => {
    setCities([]); setAreas([]); setCommunities([]);
    setFilter(f => ({ ...f, cityId: null, areaId: null, communityId: null }));
    if (filter.countryId) getCities(filter.countryId).then(setCities).catch(() => {});
  }, [filter.countryId]);

  useEffect(() => {
    setAreas([]); setCommunities([]);
    setFilter(f => ({ ...f, areaId: null, communityId: null }));
    if (filter.cityId) getAreas(filter.cityId).then(setAreas).catch(() => {});
  }, [filter.cityId]);

  useEffect(() => {
    setCommunities([]);
    setFilter(f => ({ ...f, communityId: null }));
    if (filter.areaId) getCommunities(filter.areaId).then(setCommunities).catch(() => {});
  }, [filter.areaId]);

  const loadVenues = useCallback(async (f: FilterState) => {
    setLoading(true);
    try {
      const data = await venueService.list({ communityId: f.communityId ?? undefined, search: f.search || undefined, activeOnly: false });
      setVenues(Array.isArray(data) ? data : []);
    } catch {
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadVenues(filter); }, [filter.communityId, filter.search, loadVenues]);

  function clearFilters() {
    setFilter(EMPTY_FILTER);
    setCities([]); setAreas([]); setCommunities([]);
  }

  const activeFilterCount = [filter.countryId, filter.cityId, filter.areaId, filter.communityId].filter(Boolean).length;
  const sel = (key: keyof FilterState, val: unknown) => setFilter(f => ({ ...f, [key]: val }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0078D7] to-[#025DB6] rounded-2xl p-6 text-white shadow-[0_4px_20px_-4px_rgb(0_120_215_/_0.45)]">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-14 right-10 w-36 h-36 rounded-full bg-white/5" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">Find a Venue</h1>
          <p className="text-blue-100 text-sm mb-4">Discover sports courts, halls, and activity spaces near you</p>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 bg-white placeholder:text-gray-400"
                placeholder="Search by venue name, facility…"
                value={filter.search}
                onChange={e => sel('search', e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(s => !s)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-white text-[#0078D7] shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-[#0078D7] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPin size={14} className="text-[#0078D7]" /> Filter by Location
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Country',   val: filter.countryId,   items: countries,   key: 'countryId' as const },
              { label: 'City',      val: filter.cityId,      items: cities,      key: 'cityId' as const, disabled: !cities.length },
              { label: 'Area',      val: filter.areaId,      items: areas,       key: 'areaId' as const, disabled: !areas.length },
              { label: 'Community', val: filter.communityId, items: communities, key: 'communityId' as const, disabled: !communities.length },
            ].map(({ label, val, items, key, disabled }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                <select
                  className={SELECT_CLS}
                  value={val ?? ''}
                  disabled={disabled}
                  onChange={e => sel(key, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All</option>
                  {items.map((c: Country | City | Area | Community) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? 'Searching…' : `${venues.length} venue${venues.length !== 1 ? 's' : ''} found`}
          </p>
          {filter.search && (
            <span className="text-xs bg-[#e6f3fc] text-[#025DB6] px-3 py-1 rounded-full flex items-center gap-1 font-medium">
              <Search size={11} /> "{filter.search}"
              <button onClick={() => sel('search', '')} className="ml-1 hover:text-[#025DB6]">
                <X size={10} />
              </button>
            </span>
          )}
        </div>

        {loading ? (
          <Spinner fullPage />
        ) : venues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] py-20 text-center">
            <Building2 size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-600 mb-1">No venues found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            {(activeFilterCount > 0 || filter.search) && (
              <button onClick={clearFilters} className="mt-4 text-sm text-[#0078D7] hover:underline font-medium">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map(v => (
              <VenueCard key={v.id} venue={v} onClick={() => navigate(`/venues/${v.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
