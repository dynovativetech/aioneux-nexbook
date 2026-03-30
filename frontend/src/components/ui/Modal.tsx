import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import Button from './Button';

// ── Types ──────────────────────────────────────────────────────────────────

export type ModalSize  = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalTone  = 'default' | 'danger' | 'warning' | 'success' | 'info';

// ── Size map ──────────────────────────────────────────────────────────────

const SIZE: Record<ModalSize, string> = {
  xs:   'max-w-xs',
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  full: 'max-w-full mx-4',
};

// ── Tone styles ───────────────────────────────────────────────────────────

const TONE_ICON: Record<ModalTone, ReactNode | null> = {
  default: null,
  danger:  <AlertCircle  size={20} className="text-red-600" />,
  warning: <AlertTriangle size={20} className="text-amber-500" />,
  success: <CheckCircle2  size={20} className="text-emerald-600" />,
  info:    <Info          size={20} className="text-blue-500" />,
};

const TONE_ICON_BG: Record<ModalTone, string> = {
  default: '',
  danger:  'bg-red-50   border border-red-200',
  warning: 'bg-amber-50 border border-amber-200',
  success: 'bg-emerald-50 border border-emerald-200',
  info:    'bg-blue-50  border border-blue-200',
};

// ── useKeydown hook ───────────────────────────────────────────────────────

function useKeydown(key: string, handler: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const fn = (e: KeyboardEvent) => { if (e.key === key) handler(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [key, handler, active]);
}

// ── Props ─────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen:          boolean;
  onClose:         () => void;

  title?:          string;
  description?:    string;
  size?:           ModalSize;
  tone?:           ModalTone;

  /** Content rendered in the modal body */
  children?:       ReactNode;

  /** Content rendered in the modal footer (replaces default close button) */
  footer?:         ReactNode;

  /** Whether clicking outside or pressing Escape closes the modal */
  closeOnBackdrop?: boolean;
  closeOnEscape?:   boolean;

  /** Whether to show the × close button in the header */
  showCloseButton?: boolean;

  /** Extra class on the panel */
  className?:      string;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size             = 'md',
  tone             = 'default',
  children,
  footer,
  closeOnBackdrop  = true,
  closeOnEscape    = true,
  showCloseButton  = true,
  className        = '',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useKeydown('Escape', onClose, isOpen && closeOnEscape);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Focus the panel when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => panelRef.current?.focus(), 50);
  }, [isOpen]);

  if (!isOpen) return null;

  const toneIcon = TONE_ICON[tone];
  const toneIconBg = TONE_ICON_BG[tone];
  const hasHeader = !!(title || description || toneIcon || showCloseButton);

  const panel = (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop layer */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[3px]"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`
          relative w-full ${SIZE[size]} bg-white rounded-2xl
          shadow-[0_24px_48px_-8px_rgb(0_0_0_/_0.18),_0_8px_16px_-4px_rgb(0_0_0_/_0.08)]
          border border-gray-100
          flex flex-col max-h-[90vh]
          animate-scale-in focus:outline-none
          ${className}
        `}
      >
        {/* Header */}
        {hasHeader && (
          <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
            {toneIcon && (
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${toneIconBg}`}>
                {toneIcon}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {title && (
                <h2 id="modal-title" className="font-semibold text-gray-900 text-base leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-sm text-gray-500">{description}</p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 -mt-0.5 -mr-1.5 w-8 h-8 flex items-center justify-center
                  rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100
                  transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D7]/30"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        {children && (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

// ── ConfirmModal convenience wrapper ─────────────────────────────────────

interface ConfirmModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onConfirm:    () => void;
  title:        string;
  description?: string;
  tone?:        ModalTone;
  confirmLabel?: string;
  cancelLabel?:  string;
  loading?:      boolean;
}

export function ConfirmModal({
  isOpen, onClose, onConfirm, title, description,
  tone = 'default', confirmLabel = 'Confirm', cancelLabel = 'Cancel', loading,
}: ConfirmModalProps) {
  const confirmVariant =
    tone === 'danger'  ? 'danger'  :
    tone === 'success' ? 'success' :
    'primary';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      tone={tone}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
