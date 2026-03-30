import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function BookingCalendar({ selectedDate, onSelect }: Props) {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year  = view.getFullYear();
  const month = view.getMonth();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (d: number) =>
    selectedDate?.getFullYear() === year &&
    selectedDate?.getMonth()    === month &&
    selectedDate?.getDate()     === d;

  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const isPast = (d: number) => new Date(year, month, d) < today;

  const canPrev = new Date(year, month - 1, 1) >= new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden select-none shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => canPrev && setView(new Date(year, month - 1, 1))}
          disabled={!canPrev}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="font-semibold text-gray-800 text-sm">{MONTHS[month]} {year}</span>
        <button
          type="button"
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="px-3 pb-3 pt-2">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const past = isPast(day);
            const sel  = isSelected(day);
            const now  = isToday(day);

            return (
              <button
                key={i}
                type="button"
                onClick={() => !past && onSelect(new Date(year, month, day))}
                disabled={past}
                className={`
                  relative h-9 w-full flex items-center justify-center rounded-xl text-sm font-medium transition-all
                  ${past ? 'text-gray-300 cursor-not-allowed'
                  : sel  ? 'bg-gradient-to-br from-[#0078D7] to-[#025DB6] text-white shadow-[0_2px_8px_-2px_rgb(0_120_215_/_0.40)]'
                  : now  ? 'text-[#0078D7] ring-2 ring-[#99cff3] bg-[#e6f3fc] hover:bg-[#cce7f9]'
                  :        'text-gray-700 hover:bg-[#e6f3fc] hover:text-[#0078D7] cursor-pointer'}
                `}
              >
                {day}
                {now && !sel && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0078D7]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-3 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#0078D7] inline-block" /> Selected
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full ring-2 ring-[#99cff3] bg-[#e6f3fc] inline-block" /> Today
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" /> Past
        </span>
      </div>
    </div>
  );
}
