import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Globe, Clock, Building2,
  ChevronLeft, ChevronRight, Layers, CheckCircle2, ArrowRight,
  X, ZoomIn, ZoomOut, Maximize2, Images, Heart,
} from 'lucide-react';
import { venueService, type VenueDetail } from '../../services/venueService';
import { facilityService } from '../../services/facilityService';
import type { Facility } from '../../types';
import Spinner from '../../components/ui/Spinner';
import FeedbackPanel from '../../components/ui/FeedbackPanel';
import { favoriteService } from '../../services/favoriteService';

// The API serializes DayOfWeek as a string ("Sunday", "Monday", …) via JsonStringEnumConverter
const DAY_ORDERED = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SORT: Record<string, number> = Object.fromEntries(DAY_ORDERED.map((d, i) => [d, i]));
const TODAY_NAME = DAY_ORDERED[new Date().getDay()];

const AMENITY_LABELS: Record<number, string> = {
  0: 'Parking', 1: 'Indoor AC', 2: 'Male Washroom', 3: 'Female Washroom',
  4: 'Disabled Access', 5: 'Wi-Fi', 6: 'Change Rooms', 7: 'Lockers',
  8: 'Cafeteria', 9: 'First Aid',
};

const AMENITY_ICONS: Record<number, string> = {
  0: '🚗', 1: '❄️', 2: '🚹', 3: '🚺', 4: '♿',
  5: '📶', 6: '👕', 7: '🔒', 8: '☕', 9: '🩺',
};

// ── Lightbox ──────────────────────────────────────────────────────────────────

type GalleryImage = VenueDetail['images'][number];

function Lightbox({
  images, startIndex, onClose,
}: {
  images: GalleryImage[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx,      setIdx]      = useState(startIndex);
  const [zoom,     setZoom]     = useState(1);
  const [pan,      setPan]      = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const imgRef    = useRef<HTMLImageElement>(null);
  const MIN_ZOOM  = 1;
  const MAX_ZOOM  = 4;

  const img = images[idx];

  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const prev = useCallback(() => { if (idx > 0)                   { setIdx(i => i - 1); resetZoom(); } }, [idx]);
  const next = useCallback(() => { if (idx < images.length - 1)  { setIdx(i => i + 1); resetZoom(); } }, [idx, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   prev();
      if (e.key === 'ArrowRight')  next();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(MAX_ZOOM, +(z + 0.5).toFixed(1)));
      if (e.key === '-')           setZoom(z => { const nz = Math.max(MIN_ZOOM, +(z - 0.5).toFixed(1)); if (nz === 1) setPan({ x: 0, y: 0 }); return nz; });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, onClose]);

  // Scroll to thumbnail when idx changes
  const thumbsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = thumbsRef.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [idx]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setZoom(z => {
      const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2)));
      if (nz === 1) setPan({ x: 0, y: 0 });
      return nz;
    });
  };

  // Drag to pan (only when zoomed)
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  };
  const onMouseUp = () => setDragging(false);

  const zoomIn  = () => setZoom(z => Math.min(MAX_ZOOM, +(z + 0.5).toFixed(1)));
  const zoomOut = () => setZoom(z => { const nz = Math.max(MIN_ZOOM, +(z - 0.5).toFixed(1)); if (nz === 1) setPan({ x: 0, y: 0 }); return nz; });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-white/10">
        <span className="text-white/60 text-sm">
          <span className="text-white font-semibold">{idx + 1}</span>
          <span className="mx-1">/</span>
          {images.length}
        </span>
        {img.caption && (
          <p className="text-white/80 text-sm truncate max-w-xs hidden sm:block">{img.caption}</p>
        )}
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30 transition-colors" title="Zoom out (-)">
            <ZoomOut size={15} />
          </button>
          <span className="text-white/60 text-xs w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30 transition-colors" title="Zoom in (+)">
            <ZoomIn size={15} />
          </button>
          {zoom > 1 && (
            <button onClick={resetZoom}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors ml-1" title="Reset zoom">
              <Maximize2 size={13} />
            </button>
          )}
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-red-500/80 flex items-center justify-center text-white transition-colors ml-2" title="Close (Esc)">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Main image area ── */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        onWheel={handleWheel}
        style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {/* Prev arrow */}
        {images.length > 1 && (
          <button onClick={prev} disabled={idx === 0}
            className="absolute left-3 sm:left-5 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white disabled:opacity-20 transition-all hover:-translate-x-0.5">
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Image */}
        <div
          className="select-none"
          onMouseDown={onMouseDown}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transition: dragging ? 'none' : 'transform 0.15s ease',
            transformOrigin: 'center center',
          }}
        >
          <img
            ref={imgRef}
            src={img.url}
            alt={img.caption ?? `Image ${idx + 1}`}
            draggable={false}
            className="max-h-[calc(100vh-180px)] max-w-[calc(100vw-100px)] object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Next arrow */}
        {images.length > 1 && (
          <button onClick={next} disabled={idx === images.length - 1}
            className="absolute right-3 sm:right-5 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white disabled:opacity-20 transition-all hover:translate-x-0.5">
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {images.length > 1 && (
        <div className="flex-shrink-0 border-t border-white/10 py-3 px-4">
          <div ref={thumbsRef} className="flex gap-2 overflow-x-auto scrollbar-hide justify-center flex-wrap sm:flex-nowrap">
            {images.map((im, i) => (
              <button
                key={im.id}
                onClick={() => { setIdx(i); resetZoom(); }}
                className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  i === idx
                    ? 'border-[#0078D7] shadow-[0_0_0_2px_rgb(0_120_215_/_0.4)] opacity-100 scale-105'
                    : 'border-white/20 opacity-40 hover:opacity-80 hover:border-white/40'
                }`}
              >
                <img src={im.url} alt="" draggable={false} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <p className="text-center text-white/30 text-[10px] mt-2 hidden sm:block">
            ← → navigate · scroll to zoom · drag to pan · Esc to close
          </p>
        </div>
      )}
    </div>
  );
}

// ── Image Gallery (hero slider + thumbnails) ──────────────────────────────────

function ImageGallery({ images, coverImageUrl, name }: {
  images: VenueDetail['images'];
  coverImageUrl?: string;
  name: string;
}) {
  const allImages: GalleryImage[] = images.length > 0
    ? images
    : coverImageUrl
      ? [{ id: 0, url: coverImageUrl, isPrimary: true, fileName: '', originalFileName: '', caption: undefined, sortOrder: 0 }]
      : [];

  const [activeIdx,    setActiveIdx]    = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx,  setLightboxIdx]  = useState(0);
  const [paused,       setPaused]       = useState(false);
  const [animDir,      setAnimDir]      = useState<'left' | 'right'>('right');
  const [transitioning, setTransitioning] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const SLIDE_INTERVAL = 3000;

  const goTo = useCallback((next: number, dir: 'left' | 'right' = 'right') => {
    if (transitioning) return;
    setAnimDir(dir);
    setTransitioning(true);
    setTimeout(() => {
      setActiveIdx(next);
      setTransitioning(false);
    }, 320);
  }, [transitioning]);

  const prev = useCallback(() => {
    goTo(activeIdx === 0 ? allImages.length - 1 : activeIdx - 1, 'left');
  }, [activeIdx, allImages.length, goTo]);

  const next = useCallback(() => {
    goTo(activeIdx === allImages.length - 1 ? 0 : activeIdx + 1, 'right');
  }, [activeIdx, allImages.length, goTo]);

  // Auto-slideshow every 3 s
  useEffect(() => {
    if (allImages.length <= 1 || paused) return;
    const t = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(t);
  }, [allImages.length, next, paused]);

  // Scroll active thumbnail into view
  useEffect(() => {
    const el = thumbsRef.current?.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeIdx]);

  const openAt = (i: number) => { setLightboxIdx(i); setLightboxOpen(true); };

  if (allImages.length === 0) {
    return (
      <div className="h-64 sm:h-[420px] bg-gradient-to-br from-[#e6f3fc] to-gray-100 rounded-2xl flex items-center justify-center">
        <Building2 size={56} className="text-gray-200" />
      </div>
    );
  }

  const active = allImages[activeIdx];

  return (
    <>
      <div
        className="space-y-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ── Hero banner ── */}
        <div className="relative h-64 sm:h-[400px] rounded-2xl overflow-hidden bg-gray-900 select-none">

          {/* Image with slide animation */}
          <img
            key={activeIdx}
            src={active.url}
            alt={active.caption ?? name}
            onClick={() => openAt(activeIdx)}
            draggable={false}
            className={`absolute inset-0 w-full h-full object-cover cursor-zoom-in transition-opacity duration-300 ${
              transitioning ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              transform: transitioning
                ? `translateX(${animDir === 'right' ? '-6%' : '6%'})`
                : 'translateX(0)',
              transition: 'opacity 0.32s ease, transform 0.32s ease',
            }}
          />

          {/* Dark gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

          {/* Left / Right arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 border border-white/20 flex items-center justify-center text-white transition-all hover:-translate-x-0.5 hover:scale-110 backdrop-blur-sm"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 border border-white/20 flex items-center justify-center text-white transition-all hover:translate-x-0.5 hover:scale-110 backdrop-blur-sm"
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {allImages.length > 1 && allImages.length <= 10 && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i, i > activeIdx ? 'right' : 'left')}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIdx
                      ? 'w-5 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Bottom overlay row: counter + "Show all" + auto-play indicator */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between">
            {/* Counter */}
            <span className="text-white/80 text-xs font-medium bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
              {activeIdx + 1} / {allImages.length}
            </span>

            {/* Caption */}
            {active.caption && (
              <span className="text-white/90 text-xs bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm max-w-[40%] truncate hidden sm:block">
                {active.caption}
              </span>
            )}

            {/* Show all photos button */}
            {allImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); openAt(0); }}
                className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-md border border-white/20 backdrop-blur-sm"
              >
                <Images size={12} className="text-[#0078D7]" />
                All {allImages.length} photos
              </button>
            )}
          </div>

          {/* Auto-play progress bar */}
          {allImages.length > 1 && !paused && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 overflow-hidden rounded-t-2xl">
              <div
                key={`${activeIdx}-prog`}
                className="h-full bg-white/70 rounded-full"
                style={{
                  animation: `galleryProgress ${SLIDE_INTERVAL}ms linear`,
                }}
              />
            </div>
          )}
        </div>

        {/* ── Thumbnail strip ── */}
        {allImages.length > 1 && (
          <div ref={thumbsRef} className="flex gap-2 overflow-x-auto pb-1 scroll-smooth">
            {allImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => goTo(i, i > activeIdx ? 'right' : 'left')}
                className={`flex-shrink-0 w-[72px] h-[52px] sm:w-20 sm:h-[58px] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  i === activeIdx
                    ? 'border-[#0078D7] shadow-[0_2px_10px_-2px_rgb(0_120_215_/_0.50)] scale-105 opacity-100'
                    : 'border-transparent opacity-55 hover:opacity-90 hover:scale-[1.03]'
                }`}
              >
                <img src={img.url} alt="" draggable={false} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Inject progress-bar keyframe once */}
      <style>{`
        @keyframes galleryProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <Lightbox images={allImages} startIndex={lightboxIdx} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}

// ── Facility Row ──────────────────────────────────────────────────────────────

function FacilityListCard({
  facility,
  onBook,
  isFavorite,
  onToggleFavorite,
}: {
  facility: Facility;
  onBook: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
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

      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors flex-shrink-0 ${
          isFavorite
            ? 'bg-white text-rose-600 border-rose-100'
            : 'bg-white text-gray-500 border-gray-100 hover:text-rose-600'
        }`}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
      </button>

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
  const [favVenueIds, setFavVenueIds] = useState<Set<number>>(new Set());
  const [favFacilityIds, setFavFacilityIds] = useState<Set<number>>(new Set());

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

  useEffect(() => {
    favoriteService.list()
      .then((items) => {
        const venueSet = new Set<number>();
        const facSet = new Set<number>();
        items.forEach((f) => {
          if (f.targetType === 'Venue') venueSet.add(f.targetId);
          if (f.targetType === 'Facility') facSet.add(f.targetId);
        });
        setFavVenueIds(venueSet);
        setFavFacilityIds(facSet);
      })
      .catch(() => {});
  }, []);

  if (loading) return <Spinner fullPage />;
  if (!venue) return (
    <div className="w-[80%] mx-auto py-20 text-center">
      <Building2 size={40} className="mx-auto mb-3 text-gray-200" />
      <p className="text-gray-500">Venue not found.</p>
      <button onClick={() => navigate('/venues')} className="mt-4 text-sm text-[#0078D7] hover:underline font-medium">
        Back to venues
      </button>
    </div>
  );

  const todayHours = venue.operatingHours?.find(h => String(h.dayOfWeek) === TODAY_NAME);

  return (
    <div className="w-[80%] mx-auto space-y-6">

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
              <button
                type="button"
                onClick={async () => {
                  try {
                    const isFav = favVenueIds.has(venue.id);
                    if (isFav) await favoriteService.remove('Venue' as any, venue.id);
                    else await favoriteService.add('Venue' as any, venue.id);
                    setFavVenueIds((prev) => {
                      const next = new Set(prev);
                      if (isFav) next.delete(venue.id); else next.add(venue.id);
                      return next;
                    });
                  } catch {
                    // ignore
                  }
                }}
                className={`ml-auto w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                  favVenueIds.has(venue.id)
                    ? 'bg-white text-rose-600 border-rose-100'
                    : 'bg-white text-gray-500 border-gray-100 hover:text-rose-600'
                }`}
                aria-label={favVenueIds.has(venue.id) ? 'Remove from favorites' : 'Add to favorites'}
                title={favVenueIds.has(venue.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={18} className={favVenueIds.has(venue.id) ? 'fill-current' : ''} />
              </button>
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
                    isFavorite={favFacilityIds.has(f.id)}
                    onToggleFavorite={async () => {
                      try {
                        const isFav = favFacilityIds.has(f.id);
                        if (isFav) await favoriteService.remove('Facility' as any, f.id);
                        else await favoriteService.add('Facility' as any, f.id);
                        setFavFacilityIds((prev) => {
                          const next = new Set(prev);
                          if (isFav) next.delete(f.id); else next.add(f.id);
                          return next;
                        });
                      } catch {
                        // ignore
                      }
                    }}
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

          <FeedbackPanel targetType="Venue" targetId={venue.id} />
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
              <div className="divide-y divide-gray-50">
                {[...venue.operatingHours]
                  .sort((a, b) => (DAY_SORT[String(a.dayOfWeek)] ?? 0) - (DAY_SORT[String(b.dayOfWeek)] ?? 0))
                  .map(h => {
                    const dayName = String(h.dayOfWeek); // already "Monday", "Tuesday" etc.
                    const isToday = dayName === TODAY_NAME;
                    return (
                      <div
                        key={dayName}
                        className={`flex items-center justify-between gap-2 py-2 px-2.5 rounded-xl text-xs ${
                          isToday
                            ? 'bg-[#e6f3fc] text-[#025DB6] font-semibold my-0.5'
                            : 'text-gray-600'
                        }`}
                      >
                        {/* Day name (from API — already full English name) */}
                        <span className="flex items-center gap-1.5">
                          <span className="font-medium w-[80px] flex-shrink-0">{dayName}</span>
                          {isToday && (
                            <span className="text-[9px] bg-[#0078D7] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide leading-none whitespace-nowrap">
                              Today
                            </span>
                          )}
                        </span>

                        {/* Time or Closed */}
                        <span className="flex-shrink-0 tabular-nums">
                          {h.isClosed
                            ? <span className="text-red-500 font-semibold">Closed</span>
                            : <span>
                                {h.openTime.slice(0, 5)}
                                <span className="text-gray-400 mx-1">–</span>
                                {h.closeTime.slice(0, 5)}
                              </span>
                          }
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
