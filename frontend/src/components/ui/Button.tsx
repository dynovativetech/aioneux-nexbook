import { type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'link';
export type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#0078D7] to-[#025DB6] hover:from-[#0087e0] hover:to-[#0169C9] ' +
    'text-white shadow-[0_2px_8px_-2px_rgb(0_120_215_/_0.40)] ' +
    'hover:shadow-[0_4px_14px_-2px_rgb(0_120_215_/_0.45)] ' +
    'active:from-[#025DB6] active:to-[#004e9e] border border-transparent',
  secondary:
    'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 ' +
    'border border-gray-200 hover:border-gray-300 ' +
    'shadow-[0_1px_3px_0_rgb(0_0_0_/_0.06)] hover:shadow-[0_2px_6px_-1px_rgb(0_0_0_/_0.08)]',
  ghost:
    'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-600 ' +
    'hover:text-gray-900 border border-transparent',
  danger:
    'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 ' +
    'text-white shadow-[0_2px_8px_-2px_rgb(220_38_38_/_0.35)] ' +
    'hover:shadow-[0_4px_12px_-2px_rgb(220_38_38_/_0.40)] ' +
    'border border-transparent',
  success:
    'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 ' +
    'text-white shadow-[0_2px_8px_-2px_rgb(5_150_105_/_0.35)] ' +
    'border border-transparent',
  link:
    'bg-transparent text-[#0078D7] hover:text-[#025DB6] underline-offset-2 ' +
    'hover:underline border border-transparent p-0 h-auto shadow-none',
};

const SIZE: Record<ButtonSize, string> = {
  xs: 'h-7  px-2.5 text-xs  gap-1.5 rounded-lg',
  sm: 'h-8  px-3.5 text-xs  gap-1.5 rounded-lg',
  md: 'h-9  px-4   text-sm  gap-2   rounded-xl',
  lg: 'h-11 px-5   text-sm  gap-2   rounded-xl',
  xl: 'h-12 px-6   text-base gap-2.5 rounded-2xl',
};

const ICON_ONLY_SIZE: Record<ButtonSize, string> = {
  xs: 'h-7  w-7  rounded-lg',
  sm: 'h-8  w-8  rounded-lg',
  md: 'h-9  w-9  rounded-xl',
  lg: 'h-11 w-11 rounded-xl',
  xl: 'h-12 w-12 rounded-2xl',
};

function ButtonSpinner({ size }: { size: ButtonSize }) {
  const dim = size === 'xs' || size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  return (
    <span className={`${dim} rounded-full border-2 border-current border-t-transparent animate-spin`} />
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  children?: ReactNode;
}

export default function Button({
  variant      = 'primary',
  size         = 'md',
  loading      = false,
  icon,
  iconPosition = 'left',
  iconOnly     = false,
  children,
  className    = '',
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const base =
    'inline-flex items-center justify-center font-medium ' +
    'transition-all duration-200 ease-out ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D7]/30 focus-visible:ring-offset-1 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none ' +
    'select-none whitespace-nowrap';

  const sizeCls    = iconOnly ? ICON_ONLY_SIZE[size] : SIZE[size];
  const variantCls = VARIANT[variant];

  const leftIcon  = iconPosition === 'left'  && (loading ? <ButtonSpinner size={size} /> : icon);
  const rightIcon = iconPosition === 'right' && !loading && icon;

  return (
    <button
      disabled={isDisabled}
      className={`${base} ${sizeCls} ${variantCls} ${className}`}
      {...rest}
    >
      {iconOnly
        ? (loading ? <ButtonSpinner size={size} /> : icon)
        : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
    </button>
  );
}
