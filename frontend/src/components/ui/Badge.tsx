export type BadgeColor =
  | 'gray' | 'blue' | 'indigo' | 'violet' | 'cyan'
  | 'green' | 'yellow' | 'orange' | 'red' | 'pink';

export type BadgeVariant = 'soft' | 'solid' | 'outline';
export type BadgeSize    = 'sm' | 'md' | 'lg';

const SOFT: Record<BadgeColor, string> = {
  gray:   'bg-gray-100    text-gray-700',
  blue:   'bg-[#e6f3fc]   text-[#025DB6]',
  indigo: 'bg-[#e6f3fc]   text-[#025DB6]',
  violet: 'bg-[#e6f3fc]   text-[#025DB6]',
  cyan:   'bg-cyan-50     text-cyan-700',
  green:  'bg-emerald-50  text-emerald-700',
  yellow: 'bg-amber-50    text-amber-700',
  orange: 'bg-orange-50   text-orange-700',
  red:    'bg-red-50      text-red-700',
  pink:   'bg-pink-50     text-pink-700',
};

const SOLID: Record<BadgeColor, string> = {
  gray:   'bg-gray-500     text-white',
  blue:   'bg-[#0078D7]    text-white',
  indigo: 'bg-[#0078D7]    text-white',
  violet: 'bg-[#0078D7]   text-white',
  cyan:   'bg-cyan-600     text-white',
  green:  'bg-emerald-600  text-white',
  yellow: 'bg-amber-500    text-white',
  orange: 'bg-orange-500   text-white',
  red:    'bg-red-600      text-white',
  pink:   'bg-pink-600     text-white',
};

const OUTLINE: Record<BadgeColor, string> = {
  gray:   'border border-gray-300    text-gray-700    bg-white',
  blue:   'border border-[#99cff3]   text-[#025DB6]   bg-white',
  indigo: 'border border-[#99cff3]   text-[#025DB6]   bg-white',
  violet: 'border border-[#99cff3]  text-[#025DB6]  bg-white',
  cyan:   'border border-cyan-300    text-cyan-700    bg-white',
  green:  'border border-emerald-300 text-emerald-700 bg-white',
  yellow: 'border border-amber-300   text-amber-700   bg-white',
  orange: 'border border-orange-300  text-orange-700  bg-white',
  red:    'border border-red-300     text-red-700     bg-white',
  pink:   'border border-pink-300    text-pink-700    bg-white',
};

const SIZE: Record<BadgeSize, string> = {
  sm: 'px-2   py-0.5  text-[10px] font-semibold',
  md: 'px-2.5 py-0.5  text-xs     font-medium',
  lg: 'px-3   py-1    text-sm     font-medium',
};

export function bookingStatusColor(status: string): BadgeColor {
  switch (status) {
    case 'Confirmed':  return 'green';
    case 'Pending':    return 'yellow';
    case 'Cancelled':  return 'red';
    case 'Completed':  return 'blue';
    default:           return 'gray';
  }
}

export function complaintStatusColor(status: string): BadgeColor {
  switch (status) {
    case 'Open':             return 'yellow';
    case 'InProgress':       return 'blue';
    case 'Resolved':         return 'green';
    case 'Rejected':         return 'red';
    case 'ActionRequired':   return 'red';
    case 'MoreInfoRequired': return 'yellow';
    case 'Closed':           return 'gray';
    case 'Cancelled':        return 'gray';
    default:                 return 'gray';
  }
}

interface BadgeProps {
  label:      string;
  color?:     BadgeColor;
  variant?:   BadgeVariant;
  size?:      BadgeSize;
  dot?:       boolean;
  className?: string;
}

export default function Badge({
  label,
  color   = 'gray',
  variant = 'soft',
  size    = 'md',
  dot     = false,
  className = '',
}: BadgeProps) {
  const colorCls =
    variant === 'solid'   ? SOLID[color]   :
    variant === 'outline' ? OUTLINE[color] :
    SOFT[color];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${SIZE[size]} ${colorCls} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          variant === 'solid' ? 'bg-white/60' : 'bg-current opacity-50'
        }`} />
      )}
      {label}
    </span>
  );
}


