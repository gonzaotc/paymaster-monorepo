'use client';

import type { ReactNode } from 'react';

type CardProps = {
  kicker: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Card({
  kicker,
  title,
  description,
  children,
  className,
  bodyClassName,
}: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/95 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-2xl ${className ?? ''}`}>
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
          {kicker}
        </p>
        {title && <p className="text-lg font-semibold text-slate-900">{title}</p>}
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <div className={['mt-4', bodyClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
    </div>
  );
}
