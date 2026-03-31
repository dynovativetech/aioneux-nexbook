import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, CheckCircle2,
  CalendarCheck, MapPin, Dumbbell, User2,
  CalendarDays, Clock3, ArrowRight, Home,
} from 'lucide-react';
import { useAuth }         from '../../context/AuthContext';
import { useFacilities }   from '../../hooks/useFacilities';
import { useActivities }   from '../../hooks/useActivities';
import { useInstructors }  from '../../hooks/useInstructors';
import { useAvailability } from '../../hooks/useAvailability';
import FacilityCard        from '../../components/FacilityCard';
import InstructorCard      from '../../components/InstructorCard';
import BookingCalendar     from '../../components/BookingCalendar';
import TimeSlotSelector    from '../../components/TimeSlotSelector';
import BookingSummaryPanel from '../../components/BookingSummaryPanel';
import Spinner             from '../../components/ui/Spinner';
import { bookingService }  from '../../services/bookingService';
import type { Activity, Booking, Facility, Instructor, TimeSlot } from '../../types';

// â”€â”€ Step config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STEPS = [
  { label: 'Facility',       icon: MapPin,        desc: 'Choose your community & space' },
  { label: 'Activity',       icon: Dumbbell,      desc: 'Pick a class or activity' },
  { label: 'Instructor',     icon: User2,         desc: 'Select an instructor (optional)' },
  { label: 'Date & Time',    icon: CalendarDays,  desc: 'Pick date and time slot' },
  { label: 'Confirm',        icon: CalendarCheck, desc: 'Review and confirm' },
];

// â”€â”€ Step indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StepIndicator({ current, facility, activity, slot }: {
  current: number;
  facility: Facility | null;
  activity: Activity | null;
  slot: TimeSlot | null;
}) {
  function sublabel(i: number) {
    if (i === 0) return facility?.name ?? null;
    if (i === 1) return activity?.name ?? null;
    if (i === 3) return slot ? slot.label.split('â€“')[0].trim() : null;
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-4 mb-6">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon   = s.icon;
          const done   = i < current;
          const active = i === current;
          const sub    = sublabel(i);

          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`
                  w-9 h-9 rounded-xl flex items-center justify-center transition-all
                  ${done   ? 'bg-[#0078D7] shadow-md shadow-[#99cff3]'
                  : active ? 'bg-[#0078D7] ring-4 ring-[#0078D7] shadow-md shadow-[#99cff3]'
                  :          'bg-gray-100'}
                `}>
                  {done
                    ? <CheckCircle2 size={16} className="text-white" />
                    : <Icon size={15} className={active ? 'text-white' : 'text-gray-400'} />}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block leading-none
                  ${active ? 'text-[#0078D7]' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                  {sub && done ? sub : s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-6 sm:w-10 mx-2 -mt-4 sm:-mt-5 rounded-full
                  ${i < current ? 'bg-[#0087e0]' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// â”€â”€ Success state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BookingSuccess({ booking, facility, activity, instructor, slot, date }: {
  booking: Booking;
  facility: Facility; activity: Activity; instructor: Instructor | null;
  slot: TimeSlot; date: Date;
}) {
  const navigate = useNavigate();
  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="max-w-lg mx-auto text-center py-6 space-y-6">
      {/* Icon */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Booking Confirmed!</h2>
          <p className="text-gray-500 mt-1 text-sm">Your session has been reserved successfully.</p>
        </div>
      </div>

      {/* Booking card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card text-left overflow-hidden">
        {/* Header gradient */}
        <div className="h-2 bg-gradient-to-r from-[#0078D7] to-emerald-500" />

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-50">
            <span className="text-xs text-gray-400 font-medium">Booking #</span>
            <span className="text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
              #{String(booking.id).padStart(5, '0')}
            </span>
          </div>

          {[
            { icon: MapPin,       label: 'Facility',    value: `${facility.name} Â· ${facility.location}` },
            { icon: Dumbbell,     label: 'Activity',    value: `${activity.name} (${activity.durationMinutes} min)` },
            { icon: User2,        label: 'Instructor',  value: instructor?.name ?? 'No instructor' },
            { icon: CalendarDays, label: 'Date',        value: dateStr },
            { icon: Clock3,       label: 'Time',        value: slot.label },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#e6f3fc] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={14} className="text-[#0078D7]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            </div>
          ))}

          <div className="pt-3 border-t border-gray-50">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 size={11} /> Confirmed
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/my-bookings')}
          className="flex-1 flex items-center justify-center gap-2 bg-[#0078D7] hover:bg-[#025DB6] text-white text-sm font-medium py-3 rounded-xl transition-colors shadow-sm"
        >
          <CalendarDays size={16} /> View My Bookings
        </button>
        <button
          onClick={() => navigate('/booking')}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium py-3 rounded-2xl border border-gray-100 transition-colors"
        >
          <ArrowRight size={16} /> Book Another
        </button>
      </div>
    </div>
  );
}

// â”€â”€ Location pill filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LocationFilter({ locations, active, onChange }: {
  locations: string[];
  active: string;
  onChange: (l: string) => void;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1.5">
        <Home size={12} /> Community / Location
      </p>
      <div className="flex flex-wrap gap-2">
        {['All', ...locations].map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => onChange(loc)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all
              ${active === loc
                ? 'bg-[#0078D7] border-[#0078D7] text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-[#66b7ed] hover:text-[#0078D7]'
              }`}
          >
            {loc}
          </button>
        ))}
      </div>
    </div>
  );
}

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function BookingPage() {
  const { user }   = useAuth();

  const [step,       setStep]       = useState(0);
  const [facility,   setFacility]   = useState<Facility   | null>(null);
  const [activity,   setActivity]   = useState<Activity   | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [date,       setDate]       = useState<Date       | null>(null);
  const [slot,       setSlot]       = useState<TimeSlot   | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [confirmed,  setConfirmed]  = useState<Booking | null>(null);

  // Location filter (step 0)
  const [locationFilter, setLocationFilter] = useState('All');

  const { facilities,  loading: fLoading }  = useFacilities();
  const { activities,  loading: aLoading }  = useActivities();
  const { instructors, loading: iLoading }  = useInstructors();

  const avParams = facility && date ? {
    facilityId:          facility.id,
    date:                date.toISOString().split('T')[0],
    slotDurationMinutes: activity?.durationMinutes ?? 60,
    instructorId:        instructor?.id,
  } : null;
  const { data: avData, loading: avLoading } = useAvailability(avParams);

  // Unique location list from facilities
  const locations = Array.from(new Set(facilities.map((f) => f.location)));
  const visibleFacilities = locationFilter === 'All'
    ? facilities
    : facilities.filter((f) => f.location === locationFilter);

  // Step validation
  const canContinue = [
    !!facility,
    !!activity,
    true,            // instructor is optional
    !!date && !!slot,
  ][step] ?? true;

  async function handleConfirm() {
    if (!user || !facility || !activity || !date || !slot) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await bookingService.create({
        userId:       user.id,
        facilityId:   facility.id,
        activityId:   activity.id,
        instructorId: instructor?.id,
        startTime:    slot.startTime,
        endTime:      slot.endTime,
      });
      if (res.success) {
        setConfirmed(res.data);
      } else {
        setError(res.errors?.join(', ') ?? res.message);
      }
    } catch {
      setError('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // â”€â”€ Success screen â”€â”€
  if (confirmed && facility && activity && slot && date) {
    return (
      <div className="w-[80%] mx-auto">
        <BookingSuccess
          booking={confirmed} facility={facility} activity={activity}
          instructor={instructor} slot={slot} date={date}
        />
      </div>
    );
  }

  return (
    <div className="w-[80%] mx-auto">
      <StepIndicator current={step} facility={facility} activity={activity} slot={slot} />

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4 text-red-500 hover:text-red-700 text-lg leading-none">Ã—</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* â”€â”€ Main panel â”€â”€ */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-6">

          {/* Step header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
            <div className="w-9 h-9 bg-[#e6f3fc] rounded-xl flex items-center justify-center flex-shrink-0">
              {(() => { const Icon = STEPS[step].icon; return <Icon size={16} className="text-[#0078D7]" />; })()}
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 text-base">{STEPS[step].label}</h2>
              <p className="text-xs text-gray-400">{STEPS[step].desc}</p>
            </div>
          </div>

          {/* â”€â”€ Step 0: Facility â”€â”€ */}
          {step === 0 && (
            <div>
              <LocationFilter
                locations={locations}
                active={locationFilter}
                onChange={(l) => { setLocationFilter(l); setFacility(null); }}
              />
              {fLoading ? <Spinner /> : visibleFacilities.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  No facilities in this location.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleFacilities.map((f) => (
                    <FacilityCard key={f.id} facility={f}
                      selected={facility?.id === f.id}
                      onClick={() => setFacility(f)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* â”€â”€ Step 1: Activity â”€â”€ */}
          {step === 1 && (
            <div>
              {aLoading ? <Spinner /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activities.map((a) => {
                    const sel = activity?.id === a.id;
                    return (
                      <button key={a.id} type="button" onClick={() => setActivity(a)}
                        className={`group rounded-xl border-2 p-4 text-left transition-all
                          ${sel ? 'border-[#0078D7] bg-[#e6f3fc]' : 'border-gray-200 hover:border-[#66b7ed] hover:bg-gray-50'}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors
                          ${sel ? 'bg-[#0078D7]' : 'bg-gray-100 group-hover:bg-[#cce7f9]'}`}>
                          <Dumbbell size={15} className={sel ? 'text-white' : 'text-gray-500 group-hover:text-[#0087e0]'} />
                        </div>
                        <p className="font-semibold text-gray-800 text-sm">{a.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock3 size={11} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{a.durationMinutes} minutes</span>
                        </div>
                        {sel && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-[#0078D7] font-medium">
                            <CheckCircle2 size={12} /> Selected
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* â”€â”€ Step 2: Instructor â”€â”€ */}
          {step === 2 && (
            <div>
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <User2 size={14} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  This step is optional. You can skip it to see all available slots.
                </p>
              </div>
              {iLoading ? <Spinner /> : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {instructors.map((ins) => (
                    <InstructorCard key={ins.id} instructor={ins}
                      selected={instructor?.id === ins.id}
                      onClick={() => setInstructor(instructor?.id === ins.id ? null : ins)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* â”€â”€ Step 3: Date + Time â”€â”€ */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Date + availability in a 2-col layout on desktop */}
              <div className="grid lg:grid-cols-2 gap-5 items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                    <CalendarDays size={12} /> Select date
                  </p>
                  <BookingCalendar
                    selectedDate={date}
                    onSelect={(d) => { setDate(d); setSlot(null); }}
                  />
                </div>

                {date && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                        <Clock3 size={12} /> Available slots
                      </p>
                      {avData && !avLoading && (
                        <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                          {avData.availableSlotCount} available
                        </span>
                      )}
                    </div>
                    <TimeSlotSelector
                      slots={avData?.availableSlots ?? []}
                      selected={slot}
                      onSelect={setSlot}
                      loading={avLoading}
                      date={date}
                    />
                  </div>
                )}
              </div>

              {/* No date selected yet */}
              {!date && (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center text-gray-400 text-sm">
                  <CalendarDays size={24} className="mx-auto mb-2 opacity-40" />
                  Select a date to see available slots
                </div>
              )}
            </div>
          )}

          {/* â”€â”€ Step 4: Confirm (mobile only, desktop uses sidebar) â”€â”€ */}
          {step === 4 && (
            <div className="lg:hidden">
              <BookingSummaryPanel
                facility={facility} activity={activity} instructor={instructor}
                date={date} slot={slot} onConfirm={handleConfirm} loading={submitting}
              />
            </div>
          )}

          {/* â”€â”€ Navigation â”€â”€ */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800
                disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl
                border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>

            <div className="flex items-center gap-2">
              {/* Skip button for optional instructor step */}
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => { setInstructor(null); setStep(3); }}
                  className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 transition-colors"
                >
                  Skip
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canContinue}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white
                    bg-[#0078D7] hover:bg-[#025DB6] disabled:opacity-50 disabled:cursor-not-allowed
                    px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting || !facility || !activity || !date || !slot}
                  className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-white
                    bg-[#0078D7] hover:bg-[#025DB6] disabled:opacity-50 disabled:cursor-not-allowed
                    px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  {submitting ? 'Confirming...' : 'Confirm Booking'}
                  {!submitting && <CheckCircle2 size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* â”€â”€ Sidebar summary (desktop) â”€â”€ */}
        <div className="hidden lg:block">
          <BookingSummaryPanel
            step={step}
            facility={facility} activity={activity} instructor={instructor}
            date={date} slot={slot} onConfirm={handleConfirm} loading={submitting}
          />
        </div>
      </div>
    </div>
  );
}



