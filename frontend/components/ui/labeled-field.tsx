'use client';

import type { ReactNode } from 'react';

type LabeledFieldProps = {
  label: ReactNode;
  caption?: string;
  children: ReactNode;
};

export function LabeledField({ label, caption, children }: LabeledFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        {label}
      </span>
      {children}
      {caption && <span className="text-xs text-slate-400">{caption}</span>}
    </label>
  );
}
