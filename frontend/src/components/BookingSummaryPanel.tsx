import { CheckCircle2, Circle, MapPin, Dumbbell, User2, CalendarDays, Clock3 } from 'lucide-react';
import type { Activity, Facility, Instructor, TimeSlot } from '../types';
import Spinner from './ui/Spinner';

interface Props {
  facility:   Facility   | null;
  activity:   Activity   | null;
  instructor: Instructor | null;
  date:       Date       | null;
  slot:       TimeSlot   | null;
  onConfirm:  () => void;
  loading?:   boolean;
  step?:      number;
}

function fmtDate(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

interface CheckRowProps {
  icon:      React.ReactNode;
  label:     string;
  value:     string | null;
  done:      boolean;
  optional?: boolean;
}

function CheckRow({ icon, label, value, done, optional }: CheckRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className={`flex-shrink-0 mt-0.5 ${done ? 'text-emerald-500' : 'text-gray-200'}`}>
        {done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
      </div>
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${done ? 'bg-[#e6f3fc]' : 'bg-gray-50'}`}>
        <span className={done ? 'text-[#0078D7]' : 'text-gray-300'}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-semibold uppercase tracking-wide ${done ? 'text-gray-400' : 'text-gray-300'}`}>
          {label}
          {optional && <span className="ml-1 text-gray-300 normal-case tracking-normal">(opt)</span>}
        </p>
        <p className={`text-sm font-medium truncate mt-0.5 ${done ? 'text-gray-900' : 'text-gray-300'}`}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}

export default function BookingSummaryPanel({
  facility, activity, instructor, date, slot, onConfirm, loading, step = 0,
}: Props) {
  const ready = !!facility && !!activity && !!date && !!slot;

  const completedSteps = [!!facility, !!activity, true, !!date && !!slot];
  const completedCount = completedSteps.filter(Boolean).length;
  const progressPct    = Math.round((completedCount / 4) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] sticky top-6 overflow-hidden">
      {/* Top progress bar */}
      <div className="h-1 bg-gray-50 relative">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#0078D7] to-emerald-500 transition-all duration-500 rounded-r-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Booking Summary</h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ready ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
            {ready ? 'Ready' : `${completedCount}/4 steps`}
          </span>
        </div>

        <CheckRow icon={<MapPin size={13} />}      label="Facility"   value={facility ? facility.name : null}                                    done={!!facility} />
        <CheckRow icon={<Dumbbell size={13} />}    label="Activity"   value={activity ? `${activity.name} · ${activity.durationMinutes} min` : null} done={!!activity} />
        <CheckRow icon={<User2 size={13} />}       label="Instructor" value={instructor ? instructor.name : (step >= 3 ? 'No instructor' : null)} done={step >= 3} optional />
        <CheckRow icon={<CalendarDays size={13} />}label="Date"       value={date ? fmtDate(date) : null}                                         done={!!date} />
        <CheckRow icon={<Clock3 size={13} />}      label="Time"       value={slot?.label ?? null}                                                  done={!!slot} />

        {facility && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <MapPin size={10} />
              <span>{facility.location} · Capacity {facility.capacity}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onConfirm}
          disabled={!ready || loading}
          className={`
            mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all
            ${ready && !loading
              ? 'bg-gradient-to-r from-[#0078D7] to-[#025DB6] hover:from-[#0087e0] hover:to-[#0169C9] text-white shadow-[0_4px_12px_-2px_rgb(0_120_215_/_0.40)]'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'}
          `}
        >
          {loading ? (
            <><Spinner /> Confirming…</>
          ) : (
            <><CheckCircle2 size={16} /> Confirm Booking</>
          )}
        </button>

        {!ready && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Complete the remaining steps to continue.
          </p>
        )}
      </div>
    </div>
  );
}
