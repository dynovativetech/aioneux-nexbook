import {
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
  forwardRef,
} from 'react';
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

export type InputSize = 'sm' | 'md' | 'lg';

interface FieldWrapperProps {
  label?:       string;
  description?: string;
  error?:       string;
  success?:     string;
  required?:    boolean;
  id?:          string;
  children:     ReactNode;
}

function FieldWrapper({ label, description, error, success, required, id, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 leading-none flex items-center gap-1">
          {label}
          {required && <span className="text-red-400 text-xs">*</span>}
        </label>
      )}
      {description && !error && (
        <p className="text-xs text-gray-400 -mt-1">{description}</p>
      )}
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle size={11} className="flex-shrink-0" />
          {error}
        </p>
      )}
      {success && !error && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 size={11} className="flex-shrink-0" />
          {success}
        </p>
      )}
    </div>
  );
}

const INPUT_SIZE: Record<InputSize, string> = {
  sm: 'h-8  px-3 text-xs  rounded-xl',
  md: 'h-10 px-4 text-sm  rounded-xl',
  lg: 'h-11 px-4 text-sm  rounded-xl',
};

function fieldCls(size: InputSize, error: boolean, icon: boolean, suffix: boolean, extra = '') {
  return [
    'w-full border bg-white text-gray-900',
    'placeholder:text-gray-400',
    'transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
    'read-only:bg-gray-50',
    error
      ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
      : 'border-gray-200 hover:border-gray-300 focus:ring-[#0078D7]/20 focus:border-[#0078D7]',
    INPUT_SIZE[size],
    icon   ? 'pl-9'  : '',
    suffix ? 'pr-10' : '',
    extra,
  ].join(' ');
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:       string;
  description?: string;
  error?:       string;
  success?:     string;
  icon?:        ReactNode;
  suffix?:      ReactNode;
  inputSize?:   InputSize;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, description, error, success, icon, suffix, inputSize = 'md',
     className = '', id, required, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <FieldWrapper label={label} description={description} error={error}
        success={success} required={required} id={inputId}>
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={fieldCls(inputSize, !!error, !!icon, !!suffix, className)}
            {...rest}
          />
          {suffix && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
              {suffix}
            </span>
          )}
        </div>
      </FieldWrapper>
    );
  },
);
Input.displayName = 'Input';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?:       string;
  description?: string;
  error?:       string;
  success?:     string;
  inputSize?:   InputSize;
  placeholder?: string;
  options:      SelectOption[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, description, error, success, inputSize = 'md',
     placeholder, options, className = '', id, required, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <FieldWrapper label={label} description={description} error={error}
        success={success} required={required} id={inputId}>
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            required={required}
            className={`${fieldCls(inputSize, !!error, false, true, 'appearance-none cursor-pointer')} ${className}`}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </FieldWrapper>
    );
  },
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:       string;
  description?: string;
  error?:       string;
  success?:     string;
  inputSize?:   InputSize;
  resize?:      'none' | 'y' | 'x' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, description, error, success, inputSize = 'md',
     resize = 'y', className = '', id, required, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const resizeCls = { none: 'resize-none', y: 'resize-y', x: 'resize-x', both: 'resize' }[resize];

    const sizePadding = inputSize === 'sm' ? 'px-3 py-2 text-xs' :
                        inputSize === 'lg' ? 'px-4 py-3 text-sm' :
                        'px-3.5 py-2.5 text-sm';

    return (
      <FieldWrapper label={label} description={description} error={error}
        success={success} required={required} id={inputId}>
        <textarea
          ref={ref}
          id={inputId}
          required={required}
          className={[
            'w-full border bg-white text-gray-900 rounded-xl min-h-[80px]',
            'placeholder:text-gray-400',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            error
              ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
              : 'border-gray-200 hover:border-gray-300 focus:ring-[#0078D7]/20 focus:border-[#0078D7]',
            sizePadding, resizeCls, className,
          ].join(' ')}
          {...rest}
        />
      </FieldWrapper>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Select, Textarea };
export default Input;
