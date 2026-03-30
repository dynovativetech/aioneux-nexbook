// ── Primary components ────────────────────────────────────────────────────
export { default as Button }  from './Button';
export { default as Card }    from './Card';
export { default as Input }   from './Input';
export { default as Badge }   from './Badge';
export { default as Spinner } from './Spinner';
export { default as Modal }   from './Modal';

// ── Supplementary components ─────────────────────────────────────────────
export { Select, Textarea }       from './Input';
export { InlineSpinner }           from './Spinner';
export { ConfirmModal }            from './Modal';

// ── Type exports ─────────────────────────────────────────────────────────
export type { ButtonVariant, ButtonSize }    from './Button';
export type { CardVariant, CardPadding, CardColor } from './Card';
export type { InputSize }                    from './Input';
export type { BadgeColor, BadgeVariant, BadgeSize } from './Badge';
export type { SpinnerSize }                  from './Spinner';
export type { ModalSize, ModalTone }         from './Modal';

// ── Domain badge helpers ─────────────────────────────────────────────────
export { bookingStatusColor, complaintStatusColor } from './Badge';
