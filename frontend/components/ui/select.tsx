'use client';

import type { ReactNode } from 'react';

type SelectProps = {
  children: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function Select({ children, value, onChange, disabled }: SelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={[
          'h-10 w-full appearance-none rounded-[1.1rem] border border-white/90 bg-white/80 px-4 text-sm font-semibold text-slate-900 shadow-inner shadow-slate-100 focus:border-slate-200 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-60',
        ].join(' ')}>
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-slate-500">
        ▼
      </span>
    </div>
  );
}
