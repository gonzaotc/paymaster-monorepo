'use client';

import type {
  ChangeEvent,
  InputHTMLAttributes,
  DetailedHTMLProps,
} from 'react';

type InputProps = {
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
} & Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  'onChange'
>;

export function Input({ className, onChange, ...props }: InputProps) {
  return (
    <input
      {...props}
      onChange={onChange}
      className={[
        'h-11 min-w-0 flex-1 rounded-[1.2rem] border border-white/35 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),rgba(255,255,255,0.45))] px-4 text-[0.95rem] font-medium text-slate-800/90 tracking-[0.01em] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_20px_rgba(10,16,40,0.12)] backdrop-blur-xl transition focus:border-emerald-200/50 focus:ring-2 focus:ring-emerald-100/60 focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
