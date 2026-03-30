import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Globe, Clock, Building2,
  ChevronLeft, ChevronRight, Layers, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { venueService, type VenueDetail } from '../../services/venueService';
import { facilityService } from '../../services/facilityService';
import type { Facility } from '../../types';
import Spinner from '../../components/ui/Spinner';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AMENITY_LABELS: Record<number, string> = {
  0: 'Parking', 1: 'Indoor AC', 2: 'Male Washroom', 3: 'Female Washroom',
  4: 'Disabled Access', 5: 'Wi-Fi', 6: 'Change Rooms', 7: 'Lockers',
  8: 'Cafeteria', 9: 'First Aid',
};

const AMENITY_ICONS: Record<number, string> = {
  0: '🚗', 1: '❄️', 2: '🚹', 3: '🚺', 4: '♿',
  5: '📶', 6: '👕', 7: '🔒', 8: '☕', 9: '🩺',
};

// ── Image Gallery ─────────────────────────────────────────────────────────────

function ImageGallery({ images, coverImageUrl, name }: {
  images: VenueDetail['images'];
  coverImageUrl?: string;
  name: string;
}) {
  const allImages = images.length > 0
    ? images
    : coverImageUrl
      ? [{ id: 0, url: coverImageUrl, isPrimary: true, fileName: '', originalFileName: '', caption: undefined, sortOrder: 0 }]
      : [];

  const [activeIdx, setActiveIdx] = useState(0);

  if (allImages.length === 0) {
    return (
      <div className="h-64 sm:h-80 bg-gradient-to-br from-[#e6f3fc] to-gray-100 rounded-2xl flex items-center justify-center">
        <Building2 size={48} className="text-gray-200" />
      </div>
    );
  }

  const active = allImages[activeIdx];

  return (
    <div className="space-y-2">
      <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-gray-100">
        <img src={active.url} alt={active.caption ?? name} className="w-full h-full object-cover" />
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white disabled:opacity-40 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setActiveIdx(i => Math.min(allImages.length - 1, i + 1))}
              disabled={activeIdx === allImages.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white disabled:opacity-40 transition"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {activeIdx + 1} / {allImages.length}
            </div>
          </>
        )}
        {active.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
            <p className="text-white text-xs">{active.caption}</p>
          </div>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === activeIdx
                  ? 'border-[#0078D7] shadow-[0_2px_8px_-2px_rgb(0_120_215_/_0.40)]'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Facility Row ──────────────────────────────────────────────────────────────

function FacilityListCard({ facility, onBook }: { facility: Facility; onBook: () => void }) {
  const linked = facility.facilityActivities ?? [];

  return (
    <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-4 py-3.5 hover:border-[#99cff3] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_-2px_rgb(0_0_0_/_0.08)] transition-all duration-200">
      <div className="w-10 h-10 rounded-xl bg-[#e6f3fc] flex items-center justify-center flex-shrink-0">
        <Building2 size={18} className="text-[#0078D7]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-gray-800 text-sm">{facility.name}</h4>
          {facility.isActive
            ? <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">Available</span>
            : <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">Unavailable</span>}
          {facility.requiresApproval && (
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">Approval required</span>
          )}
        </div>

        {facility.location && (
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> {facility.location}
          </p>
        )}

        {linked.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {linked.map(fa => (
              <span key={fa.activityId}
                className="inline-flex items-center gap-1 text-[10px] bg-[#e6f3fc] text-[#025DB6] px-1.5 py-0.5 rounded-full font-medium">
                <Layers size={9} /> {fa.activityName}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="text-right text-xs text-gray-400 flex-shrink-0 hidden sm:block">
        <div>Cap: <strong className="text-gray-600">{facility.capacity}</strong></div>
        <div>{facility.slotDurationMinutes ?? 60} min slots</div>
      </div>

      {facility.isActive && (
        <button
          onClick={onBook}
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#0078D7] to-[#025DB6] hover:from-[#0087e0] hover:to-[#0169C9] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-[0_2px_8px_-2px_rgb(0_120_215_/_0.40)] flex-shrink-0"
        >
          Book <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function VenuePublicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [venue,      setVenue]      = useState<VenueDetail | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!id) return;
    const venueId = Number(id);
    setLoading(true);
    Promise.all([
      venueService.get(venueId),
      facilityService.getAll({ venueId }),
    ]).then(([v, f]) => {
      setVenue(v);
      setFacilities(Array.isArray(f) ? f : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner fullPage />;
  if (!venue) return (
    <div className="max-w-3xl mx-auto py-20 text-center">
      <Building2 size={40} className="mx-auto mb-3 text-gray-200" />
      <p className="text-gray-500">Venue not found.</p>
      <button onClick={() => navigate('/venues')} className="mt-4 text-sm text-[#0078D7] hover:underline font-medium">
        Back to venues
      </button>
    </div>
  );

  const todayHours = venue.operatingHours?.find(h => h.dayOfWeek === new Date().getDay());

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Back link */}
      <button
        onClick={() => navigate('/venues')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0078D7] transition-colors font-medium"
      >
        <ChevronLeft size={15} /> All Venues
      </button>

      {/* Gallery */}
      <ImageGallery images={venue.images} coverImageUrl={venue.coverImageUrl} name={venue.name} />

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Title + meta */}
          <div>
            <div className="flex items-start gap-3 mb-2">
              {venue.logoUrl && (
                <img src={venue.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={13} className="text-gray-400" />
                  {venue.communityName} · {venue.address}
                </p>
              </div>
            </div>
            {venue.shortDescription && (
              <p className="text-gray-700 text-sm font-medium">{venue.shortDescription}</p>
            )}
            {venue.description && (
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">{venue.description}</p>
            )}
          </div>

          {/* Facilities */}
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Building2 size={16} className="text-[#0078D7]" />
              Facilities
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{facilities.length}</span>
            </h2>
            {facilities.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No facilities listed yet.</p>
            ) : (
              <div className="space-y-2">
                {facilities.map(f => (
                  <FacilityListCard
                    key={f.id}
                    facility={f}
                    onBook={() => navigate(`/book?venueId=${venue.id}&facilityId=${f.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Amenities */}
          {venue.amenities && venue.amenities.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-3">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {venue.amenities.filter(a => a.isAvailable).map(a => (
                  <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 border border-gray-100">
                    <span className="text-base leading-none">{AMENITY_ICONS[a.amenityType] ?? '✓'}</span>
                    <span className="text-xs font-medium">{AMENITY_LABELS[a.amenityType] ?? `Amenity ${a.amenityType}`}</span>
                    <CheckCircle2 size={11} className="ml-auto text-[#0078D7] flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">

          {/* Contact card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Contact</h3>
            {(venue.phone || venue.mobile) && (
              <a href={`tel:${venue.phone ?? venue.mobile}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#0078D7] transition-colors">
                <Phone size={14} className="text-gray-400" />
                {venue.phone ?? venue.mobile}
              </a>
            )}
            {venue.contactPersonEmail && (
              <a href={`mailto:${venue.contactPersonEmail}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#0078D7] transition-colors">
                <Mail size={14} className="text-gray-400" />
                {venue.contactPersonEmail}
              </a>
            )}
            {venue.website && (
              <a href={venue.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#0078D7] transition-colors">
                <Globe size={14} className="text-gray-400" />
                Website
              </a>
            )}
            {venue.googleMapsUrl && (
              <a href={venue.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#0078D7] hover:underline font-medium">
                <MapPin size={14} /> Open in Maps
              </a>
            )}
          </div>

          {/* Opening Hours */}
          {venue.operatingHours && venue.operatingHours.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock size={14} className="text-[#0078D7]" /> Opening Hours
              </h3>
              <div className="space-y-1">
                {[...venue.operatingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(h => {
                  const isToday = h.dayOfWeek === new Date().getDay();
                  return (
                    <div
                      key={h.dayOfWeek}
                      className={`flex items-center gap-3 text-xs py-1.5 px-2 rounded-xl ${
                        isToday ? 'bg-[#e6f3fc] text-[#025DB6] font-semibold' : 'text-gray-600'
                      }`}
                    >
                      <span className="w-8 shrink-0">{DAY_NAMES[h.dayOfWeek]}</span>
                      {isToday && <span className="text-[#0078D7] text-[10px] font-medium">(today)</span>}
                      <span className="ml-auto">
                        {h.isClosed
                          ? <span className="text-red-500 font-medium">Closed</span>
                          : `${h.openTime.slice(0, 5)} – ${h.closeTime.slice(0, 5)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              {todayHours && !todayHours.isClosed && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 size={12} />
                  Open now until {todayHours.closeTime.slice(0, 5)}
                </div>
              )}
            </div>
          )}

          {/* Book CTA */}
          {facilities.some(f => f.isActive) && (
            <button
              onClick={() => navigate(`/book?venueId=${venue.id}`)}
              className="w-full bg-gradient-to-r from-[#0078D7] to-[#025DB6] hover:from-[#0087e0] hover:to-[#0169C9] text-white text-sm font-semibold py-3 rounded-2xl transition-all shadow-[0_4px_12px_-2px_rgb(0_120_215_/_0.40)] hover:shadow-[0_6px_16px_-2px_rgb(0_120_215_/_0.45)]"
            >
              Book a Facility
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
