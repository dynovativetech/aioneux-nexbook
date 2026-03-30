import { type HTMLAttributes, type ReactNode } from 'react';

export type CardVariant = 'flat' | 'elevated' | 'bordered' | 'ghost' | 'highlight';
export type CardPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CardColor   = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'secondary';

const VARIANT: Record<CardVariant, string> = {
  flat:      'bg-white border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06),_0_1px_2px_-1px_rgb(0_0_0_/_0.04)]',
  elevated:  'bg-white border border-gray-100 shadow-[0_4px_12px_-2px_rgb(0_0_0_/_0.08),_0_2px_6px_-2px_rgb(0_0_0_/_0.05)]',
  bordered:  'bg-white border-2 border-gray-200',
  ghost:     'bg-gray-50/80 border border-transparent',
  highlight: 'border shadow-sm',
};

const HIGHLIGHT_COLOR: Record<CardColor, string> = {
  default:   'bg-white border-gray-200',
  primary:   'bg-[#e6f3fc] border-[#99cff3]',
  success:   'bg-emerald-50 border-emerald-200',
  warning:   'bg-amber-50   border-amber-200',
  danger:    'bg-red-50     border-red-200',
  secondary: 'bg-blue-50    border-blue-200',
};

const ACCENT_BAR: Record<CardColor, string> = {
  default:   'bg-gray-300',
  primary:   'bg-[#0078D7]',
  success:   'bg-emerald-500',
  warning:   'bg-amber-500',
  danger:    'bg-red-500',
  secondary: 'bg-blue-600',
};

const PADDING: Record<CardPadding, string> = {
  none: '',
  xs:   'p-3',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
  xl:   'p-8',
};

const HEADER_PADDING: Record<CardPadding, string> = {
  none: 'px-0  py-0',
  xs:   'px-3  py-2.5',
  sm:   'px-4  py-3',
  md:   'px-5  py-4',
  lg:   'px-6  py-4',
  xl:   'px-8  py-5',
};

interface CardHeaderProps {
  title:        ReactNode;
  description?: ReactNode;
  action?:      ReactNode;
  padding?:     CardPadding;
  className?:   string;
}

function CardHeader({ title, description, action, padding = 'md', className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between border-b border-gray-100 ${HEADER_PADDING[padding]} ${className}`}>
      <div className="min-w-0">
        {typeof title === 'string'
          ? <h3 className="font-semibold text-gray-800 text-sm leading-tight">{title}</h3>
          : title}
        {description && (
          typeof description === 'string'
            ? <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            : description
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children:   ReactNode;
  padding?:   CardPadding;
  className?: string;
}

function CardBody({ children, padding = 'md', className = '' }: CardBodyProps) {
  return (
    <div className={`${PADDING[padding]} ${className}`}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children:   ReactNode;
  padding?:   CardPadding;
  align?:     'left' | 'center' | 'right' | 'between';
  className?: string;
}

function CardFooter({ children, padding = 'md', align = 'right', className = '' }: CardFooterProps) {
  const alignCls = { left: 'justify-start', center: 'justify-center', right: 'justify-end', between: 'justify-between' }[align];
  return (
    <div className={`flex items-center border-t border-gray-100 ${HEADER_PADDING[padding]} ${alignCls} gap-3 ${className}`}>
      {children}
    </div>
  );
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?:   CardVariant;
  padding?:   CardPadding;
  color?:     CardColor;
  accentBar?: boolean;
  hover?:     boolean;
  children:   ReactNode;
  className?: string;
}

function Card({
  variant   = 'flat',
  padding   = 'none',
  color     = 'default',
  accentBar = false,
  hover     = false,
  children,
  className = '',
  onClick,
  ...rest
}: CardProps) {
  const isClickable = !!(hover || onClick);

  const baseVariantCls = variant === 'highlight'
    ? `${VARIANT.highlight} ${HIGHLIGHT_COLOR[color]}`
    : VARIANT[variant];

  const hoverCls = isClickable
    ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgb(0_0_0_/_0.10)] hover:border-gray-200 transition-all duration-200'
    : '';

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl overflow-hidden ${baseVariantCls} ${PADDING[padding]} ${hoverCls} ${className}`}
      {...rest}
    >
      {accentBar && (
        <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${ACCENT_BAR[color]}`} />
      )}
      {accentBar ? <div className="pl-[3px]">{children}</div> : children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body   = CardBody;
Card.Footer = CardFooter;

export default Card;
