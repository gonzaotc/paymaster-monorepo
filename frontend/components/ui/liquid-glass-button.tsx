'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type LiquidGlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function LiquidGlassButton({
  children,
  className,
  ...props
}: LiquidGlassButtonProps) {
  return (
    <button
      {...props}
      className={[
        'rounded-full border border-white/70 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_25px_65px_rgba(15,23,42,0.18)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}
