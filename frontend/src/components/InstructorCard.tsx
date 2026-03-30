import { Award, Briefcase } from 'lucide-react';
import type { Instructor } from '../types';

interface Props {
  instructor: Instructor;
  selected?: boolean;
  onClick?: () => void;
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function InstructorCard({ instructor, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left rounded-2xl border-2 p-4 transition-all focus:outline-none
        hover:shadow-[0_4px_12px_-2px_rgb(0_0_0_/_0.08)] hover:border-[#0078D7]
        ${selected
          ? 'border-[#0078D7] bg-[#e6f3fc] shadow-[0_4px_12px_-2px_rgb(0_120_215_/_0.25)]'
          : 'border-gray-100 bg-white'}
      `}
    >
      {/* Avatar */}
      <div className={`
        w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm mb-3
        ${selected
          ? 'bg-gradient-to-br from-[#0078D7] to-[#025DB6] text-white shadow-[0_2px_8px_-2px_rgb(0_120_215_/_0.40)]'
          : 'bg-gray-100 text-gray-600'}
      `}>
        {initials(instructor.name)}
      </div>

      <h4 className="font-semibold text-gray-900 text-sm">{instructor.name}</h4>

      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
        <Award size={12} />
        <span>{instructor.expertise}</span>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
        <Briefcase size={12} />
        <span>{instructor.experienceYears} yrs experience</span>
      </div>
    </button>
  );
}
