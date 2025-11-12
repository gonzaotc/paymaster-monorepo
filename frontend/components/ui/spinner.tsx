'use client';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'light' | 'dark';
  className?: string;
};

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-6 w-6 border-[3px]',
};

const toneClasses: Record<NonNullable<SpinnerProps['tone']>, string> = {
  light: 'border-slate-400/40 border-t-white border-l-white',
  dark: 'border-slate-500/50 border-t-slate-800 border-l-slate-800',
};

export function Spinner({
  size = 'md',
  tone = 'light',
  className,
}: SpinnerProps) {
  return (
    <span
      className={[
        'inline-block animate-spin rounded-full',
        sizeClasses[size],
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    />
  );
}
