import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2, Layers, CalendarDays, Clock3, CheckCircle2,
  ChevronRight, ChevronLeft, Users, ArrowRight, MapPin, Search,
} from 'lucide-react';
import { venueService, type VenueListItem } from '../../services/venueService';
import { facilityService } from '../../services/facilityService';
import { availabilityService } from '../../services/availabilityService';
import { bookingService } from '../../services/bookingService';
import { getCountries, getCities } from '../../services/locationService';
import { useAuth } from '../../context/AuthContext';
import BookingCalendar from '../../components/BookingCalendar';
import Spinner from '../../components/ui/Spinner';
import type { Facility, Activity, TimeSlot, Booking, Country, City, Community } from '../../types';

// â”€â”€ Step config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STEPS = [
  { label: 'Venue',     icon: Building2 },
  { label: 'Facility',  icon: MapPin },
  { label: 'Activity',  icon: Layers },
  { label: 'Date & Time', icon: CalendarDays },
  { label: 'Confirm',   icon: CheckCircle2 },
];

// â”€â”€ Step indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center min-w-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${done   ? 'bg-[#cce7f9] text-[#025DB6]'
              : active ? 'bg-gradient-to-r from-[#0078D7] to-[#025DB6] text-white shadow-sm'
              :          'bg-gray-100 text-gray-400'}`}>
              {done ? <CheckCircle2 size={12} /> : <Icon size={12} />}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight size={12} className={`mx-1 flex-shrink-0 ${i < current ? 'text-[#66b7ed]' : 'text-gray-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// â”€â”€ Slot grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SlotGrid({ slots, selected, onSelect, loading }: {
  slots: TimeSlot[];
  selected: TimeSlot | null;
  onSelect: (s: TimeSlot) => void;
  loading: boolean;
}) {
  if (loading) return <div className="py-6 flex justify-center"><Spinner /></div>;
  if (slots.length === 0) return (
    <div className="py-8 text-center text-gray-400 text-sm">
      <Clock3 size={24} className="mx-auto mb-2 opacity-40" />
      No slots available for this date.
    </div>
  );

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((s, i) => {
        const sel = selected?.startTime === s.startTime;
        return (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className={`py-2 px-2 rounded-xl text-xs font-medium border-2 transition-all
              ${sel
                ? 'bg-[#0078D7] border-[#0078D7] text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-700 hover:border-[#0078D7] hover:bg-[#e6f3fc]'}`}
          >
            {s.label.split('-')[0].trim()}
            {sel && <div className="mt-0.5 text-blue-100">Selected</div>}
          </button>
        );
      })}
    </div>
  );
}

// â”€â”€ Booking summary card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SummaryCard({ venue, facility, activity, date, slot, participants }: {
  venue: VenueListItem | null; facility: Facility | null; activity: Activity | null;
  date: Date | null; slot: TimeSlot | null; participants: number;
}) {
  const rows = [
    { label: 'Venue',     value: venue?.name, icon: Building2 },
    { label: 'Facility',  value: facility?.name, icon: MapPin },
    { label: 'Activity',  value: activity?.name, icon: Layers },
    { label: 'Date',      value: date?.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), icon: CalendarDays },
    { label: 'Time',      value: slot?.label, icon: Clock3 },
    { label: 'Participants', value: participants > 1 ? `${participants} people` : '1 person', icon: Users },
  ].filter(r => r.value);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Booking Summary</h3>
      {rows.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#e6f3fc] rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon size={13} className="text-[#0078D7]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// â”€â”€ Success screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BookingSuccessScreen({ booking, onNew }: { booking: Booking; onNew: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto text-center py-10 space-y-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {booking.status === 'Pending' ? 'Booking Submitted!' : 'Booking Confirmed!'}
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            {booking.status === 'Pending'
              ? 'Your request is pending organizer confirmation. You will receive an email once confirmed.'
              : 'Your facility has been reserved successfully.'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow p-5 text-left space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-gray-50">
          <span className="text-xs text-gray-400">Booking ID</span>
          <span className="text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
            #{String(booking.id).padStart(5, '0')}
          </span>
        </div>
        {[
          { label: 'Facility', value: booking.facilityName },
          { label: 'Activity', value: booking.activityName },
          { label: 'Status',   value: booking.status },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-400">{label}</span>
            <span className="font-medium text-gray-700">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate('/my-bookings')}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0078D7] to-[#025DB6] hover:from-[#0087e0] hover:to-[#0169C9] text-white text-sm font-medium py-3 rounded-xl transition-colors"
        >
          <CalendarDays size={15} /> My Bookings
        </button>
        <button
          onClick={onNew}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium py-3 rounded-xl transition-colors"
        >
          <ArrowRight size={15} /> Book Again
        </button>
      </div>
    </div>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function FacilityBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const preVenueId    = searchParams.get('venueId')    ? Number(searchParams.get('venueId'))    : null;
  const preFacilityId = searchParams.get('facilityId') ? Number(searchParams.get('facilityId')) : null;

  const [step, setStep] = useState(0);

  // ── Search state (Step 0) ────────────────────────────────────────────────
  const [countries,    setCountries]    = useState<Country[]>([]);
  const [cities,       setCities]       = useState<City[]>([]);
  const [communities,  setCommunities]  = useState<Community[]>([]);
  const [countryId,    setCountryId]    = useState<number | null>(null);
  const [cityId,       setCityId]       = useState<number | null>(null);
  const [communityId,  setCommunityId]  = useState<number | null>(null);
  const [searchText,   setSearchText]   = useState('');
  const [venues,       setVenues]       = useState<VenueListItem[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [searchDone,   setSearchDone]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Booking state ────────────────────────────────────────────────────────
  const [venue,       setVenue]       = useState<VenueListItem | null>(null);
  const [facility,    setFacility]    = useState<Facility | null>(null);
  const [activity,    setActivity]    = useState<Activity | null>(null);
  const [date,        setDate]        = useState<Date | null>(null);
  const [slot,        setSlot]        = useState<TimeSlot | null>(null);
  const [participants, setParticipants] = useState(1);
  const [notes,       setNotes]       = useState('');
  const [facilities,  setFacilities]  = useState<Facility[]>([]);
  const [slots,       setSlots]       = useState<TimeSlot[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [loadingSlots,     setLoadingSlots]       = useState(false);
  const [submitting,       setSubmitting]         = useState(false);
  const [error,            setError]              = useState('');
  const [confirmed,        setConfirmed]          = useState<Booking | null>(null);

  // Load countries on mount
  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
  }, []);

  // Cascade: country → cities
  useEffect(() => {
    setCities([]); setCommunities([]);
    setCityId(null); setCommunityId(null);
    if (countryId) getCities(countryId).then(setCities).catch(() => {});
  }, [countryId]);

  // Cascade: city → areas → communities
  useEffect(() => {
    setCommunities([]); setCommunityId(null);
    if (!cityId) return;
    import('../../services/locationService').then(({ getAreas, getCommunities: getComms }) => {
      getAreas(cityId)
        .then(areas => Promise.all(areas.map(a => getComms(a.id))))
        .then(nested => setCommunities(nested.flat()))
        .catch(() => {});
    });
  }, [cityId]);

  // Debounced search trigger
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchText.trim() || communityId || countryId) doSearch();
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchText, communityId]); // eslint-disable-line

  function doSearch() {
    setLoadingVenues(true);
    setSearchDone(false);
    venueService.list({
      activeOnly:  true,
      communityId: communityId ?? undefined,
      search:      searchText.trim() || undefined,
    })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setVenues(list);
        setSearchDone(true);
        // Handle deep-link pre-selection
        if (preVenueId && !venue) {
          const pre = list.find(v => v.id === preVenueId);
          if (pre) { setVenue(pre); setStep(1); }
        }
      })
      .catch(() => { setVenues([]); setSearchDone(true); })
      .finally(() => setLoadingVenues(false));
  }

  // Handle pre-selected venue from URL on mount
  useEffect(() => {
    if (preVenueId) {
      setLoadingVenues(true);
      venueService.list({ activeOnly: true })
        .then(data => {
          const list = Array.isArray(data) ? data : [];
          setVenues(list);
          setSearchDone(true);
          const pre = list.find(v => v.id === preVenueId);
          if (pre) { setVenue(pre); setStep(1); }
        })
        .catch(() => {})
        .finally(() => setLoadingVenues(false));
    }
  }, []); // eslint-disable-line

  // Load facilities when venue selected
  useEffect(() => {
    if (!venue) { setFacilities([]); return; }
    setLoadingFacilities(true);
    facilityService.getAll({ venueId: venue.id })
      .then(data => {
        const list = Array.isArray(data) ? data.filter((f: Facility) => f.isActive) : [];
        setFacilities(list);
        if (preFacilityId) {
          const pre = list.find((f: Facility) => f.id === preFacilityId);
          if (pre) { setFacility(pre); setStep(2); }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFacilities(false));
  }, [venue]); // eslint-disable-line

  // Load slots when facility + date selected
  const loadSlots = useCallback(async (f: Facility, d: Date) => {
    setLoadingSlots(true);
    setSlots([]);
    setSlot(null);
    try {
      const dateStr = d.toISOString().split('T')[0];
      const res = await availabilityService.getSlots({
        facilityId:          f.id,
        date:                dateStr,
        slotDurationMinutes: f.slotDurationMinutes ?? 60,
      });
      setSlots(res.data?.availableSlots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (facility && date) loadSlots(facility, date);
  }, [facility, date, loadSlots]);

  // Activities from linked facility activities
  const linkedActivities: Activity[] = (facility?.facilityActivities ?? []).map(fa => ({
    id: fa.activityId,
    name: fa.activityName,
    durationMinutes: facility?.slotDurationMinutes ?? 60,
    tenantId: 0,
    bufferMinutes: 0,
    price: 0,
    isActive: true,
  }));

  async function handleConfirm() {
    if (!user || !facility || !date || !slot) return;
    setError('');
    setSubmitting(true);
    try {
      const dateStr   = date.toISOString().split('T')[0];
      const startTime = `${dateStr}T${slot.startTime.includes('T') ? slot.startTime.split('T')[1] : slot.startTime}`;
      const endTime   = `${dateStr}T${slot.endTime.includes('T')   ? slot.endTime.split('T')[1]   : slot.endTime}`;

      // Only include activityId if a valid one is selected/available
      const resolvedActivityId = activity?.id ?? linkedActivities[0]?.id;

      const res = await bookingService.create({
        userId:           user.id,
        facilityId:       facility.id,
        ...(resolvedActivityId ? { activityId: resolvedActivityId } : {}),
        startTime,
        endTime,
        participantCount: participants,
        notes:            notes || undefined,
      });
      if (res.success && res.data) {
        setConfirmed(res.data);
      } else {
        setError(res.message ?? 'Booking failed. Please try again.');
      }
    } catch (err) {
      // Extract the real error message from the API response if available
      const apiMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string; errors?: string[] } } })
              .response?.data?.message ??
            (err as { response?: { data?: { errors?: string[] } } })
              .response?.data?.errors?.join(', ')
          : null;
      setError(apiMsg || 'Booking failed. Please check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(0); setVenue(null); setFacility(null); setActivity(null);
    setDate(null); setSlot(null); setParticipants(1); setNotes('');
    setConfirmed(null); setError('');
    setCountryId(null); setCityId(null); setCommunityId(null);
    setSearchText(''); setVenues([]); setSearchDone(false);
  }

  if (confirmed) return (
    <div className="w-[80%] mx-auto">
      <BookingSuccessScreen booking={confirmed} onNew={reset} />
    </div>
  );

  const canNext = [
    !!venue,
    !!facility,
    true,               // activity optional if none linked
    !!date && !!slot,
  ][step] ?? true;

  return (
    <div className="w-[80%] mx-auto space-y-5">
      <StepBar current={step} />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">x</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* â”€â”€ Main panel â”€â”€ */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
            {(() => { const Icon = STEPS[step].icon; return <div className="w-8 h-8 bg-[#e6f3fc] rounded-xl flex items-center justify-center"><Icon size={15} className="text-[#0078D7]" /></div>; })()}
            <h2 className="font-semibold text-gray-800">{STEPS[step].label}</h2>
          </div>

          {/* Step 0: Search & select venue */}
          {step === 0 && (
            <div className="space-y-4">
              {/* Search filters */}
              <div className="grid sm:grid-cols-2 gap-3">
                {/* Country */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                  <select
                    value={countryId ?? ''}
                    onChange={e => setCountryId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7] bg-white"
                  >
                    <option value="">All countries</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <select
                    value={cityId ?? ''}
                    onChange={e => setCityId(e.target.value ? Number(e.target.value) : null)}
                    disabled={cities.length === 0}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7] bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">All cities</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Community */}
              {communities.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Community</label>
                  <select
                    value={communityId ?? ''}
                    onChange={e => setCommunityId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7] bg-white"
                  >
                    <option value="">All communities</option>
                    {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Search text */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Search size={15} />
                </div>
                <input
                  type="text"
                  placeholder="Search venue or facility by name..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0078D7]/25 focus:border-[#0078D7]"
                />
              </div>

              <button
                onClick={doSearch}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0078D7] to-[#025DB6] hover:from-[#0087e0] hover:to-[#0169C9] text-white text-sm font-semibold py-2.5 rounded-xl shadow-sm transition-colors"
              >
                <Search size={14} /> Search Venues
              </button>

              {/* Results */}
              {loadingVenues && (
                <div className="py-6 flex justify-center"><Spinner /></div>
              )}

              {!loadingVenues && searchDone && venues.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-sm">
                  <Building2 size={24} className="mx-auto mb-2 opacity-30" />
                  No venues found. Try adjusting your search.
                </div>
              )}

              {!loadingVenues && venues.length > 0 && (
                <>
                  <p className="text-xs text-gray-400">{venues.length} venue{venues.length !== 1 ? 's' : ''} found</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {venues.map(v => (
                      <button
                        key={v.id}
                        onClick={() => { setVenue(v); setFacility(null); setActivity(null); }}
                        className={`group text-left rounded-xl border-2 p-4 transition-all
                          ${venue?.id === v.id ? 'border-[#0078D7] bg-[#e6f3fc]' : 'border-gray-200 hover:border-[#66b7ed]'}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-gray-800 text-sm">{v.name}</p>
                          {venue?.id === v.id && <CheckCircle2 size={16} className="text-[#0078D7] flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin size={10} /> {v.communityName}
                        </p>
                        <p className="text-xs text-[#0078D7] mt-2">{v.facilityCount} facilit{v.facilityCount === 1 ? 'y' : 'ies'}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 1: Facility */}
          {step === 1 && (
            loadingFacilities ? <Spinner /> : facilities.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No facilities available in this venue.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {facilities.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setFacility(f); setActivity(null); setDate(null); setSlot(null); }}
                    className={`group text-left rounded-xl border-2 p-4 transition-all
                      ${facility?.id === f.id ? 'border-[#0078D7] bg-[#e6f3fc]' : 'border-gray-200 hover:border-[#66b7ed]'}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-gray-800 text-sm">{f.name}</p>
                      {facility?.id === f.id && <CheckCircle2 size={16} className="text-[#0078D7] flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{f.location}</p>
                    {(f.facilityActivities ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(f.facilityActivities ?? []).map(fa => (
                          <span key={fa.activityId} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                            {fa.activityName}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {f.slotDurationMinutes ?? 60} min slots Â· Capacity {f.capacity}
                    </p>
                  </button>
                ))}
              </div>
            )
          )}

          {/* Step 2: Activity */}
          {step === 2 && (
            <div>
              {linkedActivities.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-500 mb-2">This facility has no specific activity types linked.</p>
                  <p className="text-xs text-gray-400">You can proceed to select a date and time.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {linkedActivities.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setActivity(a)}
                      className={`group text-left rounded-xl border-2 p-4 transition-all
                        ${activity?.id === a.id ? 'border-[#0078D7] bg-[#e6f3fc]' : 'border-gray-200 hover:border-[#66b7ed]'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{a.name}</p>
                        {activity?.id === a.id && <CheckCircle2 size={16} className="text-[#0078D7] flex-shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                  <CalendarDays size={12} /> Select date
                </p>
                <BookingCalendar
                  selectedDate={date}
                  onSelect={d => { setDate(d); setSlot(null); }}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                  <Clock3 size={12} /> Available slots
                  {!loadingSlots && slots.length > 0 && (
                    <span className="ml-auto text-emerald-600">{slots.length} open</span>
                  )}
                </p>
                {!date ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    <CalendarDays size={20} className="mx-auto mb-2 opacity-40" />
                    Select a date first
                  </div>
                ) : (
                  <SlotGrid slots={slots} selected={slot} onSelect={setSlot} loading={loadingSlots} />
                )}
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Participants
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setParticipants(p => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold text-gray-800">{participants}</span>
                  <button
                    onClick={() => setParticipants(p => Math.min(facility?.capacity ?? 20, p + 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold"
                  >
                    +
                  </button>
                  <span className="text-xs text-gray-400">max {facility?.capacity ?? 20}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30 resize-none"
                  placeholder="Any special requests or notes for the organizer..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
              {facility?.requiresApproval && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                  This facility requires organizer approval. Your booking will be confirmed once reviewed.
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800
                disabled:opacity-40 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={15} /> Back
            </button>

            <div className="flex items-center gap-2">
              {step === 2 && linkedActivities.length === 0 && (
                <button
                  onClick={() => setStep(3)}
                  className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 transition-colors"
                >
                  Skip (no activity)
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white
                    bg-gradient-to-r from-[#0078D7] to-[#025DB6] hover:from-[#0087e0] hover:to-[#0169C9] disabled:opacity-40 disabled:cursor-not-allowed
                    px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  Continue <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white
                    bg-gradient-to-r from-[#0078D7] to-[#025DB6] hover:from-[#0087e0] hover:to-[#0169C9] disabled:opacity-40
                    px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  {submitting ? 'Confirming...' : 'Confirm Booking'}
                  {!submitting && <CheckCircle2 size={15} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar summary */}
        <div className="space-y-4">
          <SummaryCard
            venue={venue} facility={facility} activity={activity}
            date={date} slot={slot} participants={participants}
          />
          {venue && (
            <button
              onClick={() => navigate(`/venues/${venue.id}`)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#0078D7] py-2 transition-colors"
            >
              <Building2 size={12} /> View venue details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

