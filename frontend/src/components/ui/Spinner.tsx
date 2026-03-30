export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE: Record<SpinnerSize, string> = {
  xs: 'h-3  w-3  border-[1.5px]',
  sm: 'h-4  w-4  border-2',
  md: 'h-6  w-6  border-2',
  lg: 'h-8  w-8  border-[3px]',
  xl: 'h-10 w-10 border-[3px]',
};

interface SpinnerProps {
  size?:      SpinnerSize;
  className?: string;
  fullPage?:  boolean;
}

export default function Spinner({ size = 'lg', className = '', fullPage = false }: SpinnerProps) {
  const spinner = (
    <div
      className={`rounded-full border-[#0078D7]/20 border-t-[#0078D7] animate-spin ${SIZE[size]}`}
    />
  );

  if (fullPage) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        {spinner}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      {spinner}
    </div>
  );
}

export function InlineSpinner({ size = 'sm', className = '' }: Omit<SpinnerProps, 'fullPage'>) {
  return (
    <div className={`rounded-full border-current border-t-transparent animate-spin inline-block ${SIZE[size]} ${className}`} />
  );
}
