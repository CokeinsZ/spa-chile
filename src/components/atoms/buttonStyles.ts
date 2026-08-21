/**
 * Estilos de botón compartidos entre Button.astro y las islas React,
 * para mantener una sola fuente de verdad visual.
 */
export type ButtonVariant = 'dark' | 'primary' | 'ghost' | 'outline';

const base =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border px-5 py-2.5 font-display text-sm font-semibold whitespace-nowrap transition-all duration-200 hover:-translate-y-px';

const variants: Record<ButtonVariant, string> = {
  dark: 'border-navy bg-navy text-white hover:border-teal-deep hover:bg-teal-deep',
  primary: 'border-brick bg-brick text-white hover:border-brick-light hover:bg-brick-light',
  ghost: 'border-navy bg-transparent text-navy hover:bg-navy hover:text-white',
  outline: 'border-white/35 bg-transparent text-white hover:bg-white/10',
};

export function buttonClass(variant: ButtonVariant = 'dark', extra?: string): string {
  return [base, variants[variant], extra].filter(Boolean).join(' ');
}
