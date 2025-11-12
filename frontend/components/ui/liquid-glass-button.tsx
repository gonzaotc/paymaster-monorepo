'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type LiquidGlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: 'default' | 'positive' | 'negative';
};

export function LiquidGlassButton({
  children,
  className,
  tone = 'default',
  ...props
}: LiquidGlassButtonProps) {
  const toneClass = (() => {
    switch (tone) {
      case 'positive':
        return 'from-emerald-400/90 via-emerald-300/80 to-teal-200/80 text-emerald-950 border-emerald-200/80 hover:text-emerald-950';
      case 'negative':
        return 'from-rose-400/90 via-rose-300/80 to-orange-200/80 text-rose-950 border-rose-200/80 hover:text-rose-950';
      default:
        return 'from-slate-200/80 via-white/70 to-slate-100/60 text-slate-600 border-white/60 hover:text-slate-700';
    }
  })();

  return (
    <button
      {...props}
      className={[
        'rounded-full border bg-linear-to-br px-5 py-2.5 text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.16)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:translate-y-0',
        toneClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}>
      {children}
    </button>
  );
}
