import { MapPin, Users, CheckCircle2 } from 'lucide-react';
import type { Facility } from '../types';

interface Props {
  facility: Facility;
  selected?: boolean;
  onClick?: () => void;
}

const GRADIENTS = [
  'from-[#0078D7] to-[#339fe7]',
  'from-[#025DB6] to-[#0087e0]',
  'from-blue-400 to-cyan-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
];

export default function FacilityCard({ facility, selected, onClick }: Props) {
  const grad = GRADIENTS[facility.id % GRADIENTS.length];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group w-full text-left rounded-2xl border-2 transition-all focus:outline-none overflow-hidden
        hover:shadow-[0_8px_24px_-4px_rgb(0_0_0_/_0.10)] hover:border-[#0078D7]
        ${selected
          ? 'border-[#0078D7] shadow-[0_4px_12px_-2px_rgb(0_120_215_/_0.30)]'
          : 'border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)]'}
      `}
    >
      {/* Gradient header */}
      <div className={`h-16 bg-gradient-to-br ${grad} relative`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
            <CheckCircle2 size={14} className="text-[#0078D7]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-4 transition-colors ${selected ? 'bg-[#e6f3fc]' : 'bg-white group-hover:bg-gray-50'}`}>
        <h3 className="font-semibold text-gray-900 text-sm mb-2">{facility.name}</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <MapPin size={11} className="text-gray-400 flex-shrink-0" />
          <span className="truncate">{facility.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users size={11} className="text-gray-400 flex-shrink-0" />
          <span>Capacity: {facility.capacity}</span>
        </div>
      </div>
    </button>
  );
}
