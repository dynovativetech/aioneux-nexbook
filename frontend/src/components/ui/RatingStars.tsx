import { Star } from 'lucide-react';

export default function RatingStars({
  value,
  onChange,
  size = 16,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            className={`p-0.5 rounded ${readOnly ? 'cursor-default' : 'hover:bg-gray-50'}`}
            aria-label={`${n} star`}
          >
            <Star
              size={size}
              className={active ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
            />
          </button>
        );
      })}
    </div>
  );
}

