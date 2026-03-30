import { Sunrise, Sun, Moon, Clock, CalendarX } from 'lucide-react';
import type { TimeSlot } from '../types';
import Spinner from './ui/Spinner';

interface Props {
  slots:    TimeSlot[];
  selected: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  loading?: boolean;
  date?:    Date | null;
}

interface Group {
  key:       string;
  label:     string;
  range:     string;
  icon:      React.ReactNode;
  headerCls: string;
  slots:     TimeSlot[];
}

function buildGroups(slots: TimeSlot[]): Group[] {
  const morning:   TimeSlot[] = [];
  const afternoon: TimeSlot[] = [];
  const evening:   TimeSlot[] = [];

  for (const slot of slots) {
    const hour = new Date(slot.startTime).getHours();
    if      (hour < 12) morning.push(slot);
    else if (hour < 17) afternoon.push(slot);
    else                evening.push(slot);
  }

  return [
    { key: 'morning',   label: 'Morning',   range: '6 am – 12 pm', icon: <Sunrise size={13} />, headerCls: 'text-amber-600 bg-amber-50',     slots: morning },
    { key: 'afternoon', label: 'Afternoon', range: '12 pm – 5 pm', icon: <Sun size={13} />,     headerCls: 'text-[#0078D7] bg-[#e6f3fc]',   slots: afternoon },
    { key: 'evening',   label: 'Evening',   range: '5 pm – 10 pm', icon: <Moon size={13} />,    headerCls: 'text-[#025DB6] bg-[#cce7f9]',   slots: evening },
  ].filter((g) => g.slots.length > 0);
}

function fmtDateShort(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function TimeSlotSelector({ slots, selected, onSelect, loading, date }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Spinner />
        <p className="text-xs text-gray-400">Loading available slots…</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 gap-3 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <CalendarX size={18} className="text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">No slots available</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {date ? `No availability on ${fmtDateShort(date)}.` : 'Try a different date.'}
          </p>
        </div>
      </div>
    );
  }

  const groups = buildGroups(slots);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="flex items-center justify-between mb-2 px-2">
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${group.headerCls}`}>
              {group.icon}
              {group.label}
              <span className="opacity-70">· {group.range}</span>
            </div>
            <span className="text-xs text-gray-400">{group.slots.length} slot{group.slots.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {group.slots.map((slot) => {
              const isSel = selected?.startTime === slot.startTime;
              const parts = slot.label.split('–');
              const start = parts[0]?.trim() ?? slot.label;
              const end   = parts[1]?.trim() ?? '';

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => onSelect(slot)}
                  className={`
                    group relative rounded-xl border-2 px-3 py-2.5 text-left transition-all
                    ${isSel
                      ? 'border-[#0078D7] bg-gradient-to-br from-[#0078D7] to-[#025DB6] shadow-[0_4px_12px_-2px_rgb(0_120_215_/_0.40)]'
                      : 'border-gray-200 bg-white hover:border-[#0078D7] hover:bg-[#e6f3fc]'}
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className={isSel ? 'text-blue-100' : 'text-gray-400 group-hover:text-[#0078D7]'} />
                    <span className={`text-sm font-semibold ${isSel ? 'text-white' : 'text-gray-800'}`}>
                      {start}
                    </span>
                  </div>
                  {end && (
                    <p className={`text-[10px] mt-0.5 pl-4 ${isSel ? 'text-blue-100' : 'text-gray-400'}`}>
                      until {end}
                    </p>
                  )}
                  {isSel && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#0078D7] rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
