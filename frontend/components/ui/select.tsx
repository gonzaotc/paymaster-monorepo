'use client';

import type { ReactNode } from 'react';

type SelectProps = {
  children: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function Select({
  children,
  value,
  onChange,
  disabled,
  className,
}: SelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={[
          'h-11 w-full appearance-none rounded-[1.2rem] border border-white/35 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),rgba(255,255,255,0.45))] px-4 text-[0.95rem] font-medium text-slate-800/90 tracking-[0.01em] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_20px_rgba(10,16,40,0.12)] backdrop-blur-xl transition focus:border-indigo-200/50 focus:ring-2 focus:ring-indigo-100/60 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        ]
          .filter(Boolean)
          .join(' ')}>
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-slate-500">
        ▼
      </span>
    </div>
  );
}
