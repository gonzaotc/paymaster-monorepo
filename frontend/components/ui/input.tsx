'use client';

import type {
  ChangeEvent,
  InputHTMLAttributes,
  DetailedHTMLProps,
} from 'react';

type InputProps = {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
        'h-10 min-w-0 flex-1 rounded-[1.1rem] border border-white/90 bg-white/80 px-4 text-sm font-semibold text-slate-900 shadow-inner shadow-slate-100 placeholder:text-slate-400 focus:border-slate-200 focus:outline-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
