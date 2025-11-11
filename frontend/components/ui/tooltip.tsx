'use client';

import { ReactNode, useId, useState } from 'react';

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className={`relative inline-flex ${className ?? ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}>
      <span aria-describedby={open ? tooltipId : undefined}>{children}</span>
      <span
        id={tooltipId}
        role="tooltip"
        className={[
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 -translate-y-2 rounded-2xl border border-white/70 bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 text-center shadow-[0_20px_45px_rgba(15,23,42,0.12)] backdrop-blur',
          open ? 'opacity-100' : 'opacity-0',
          'transition-opacity duration-150 ease-out',
          'min-w-48',
          '-top-1',
        ].join(' ')}>
        {content}
      </span>
    </span>
  );
}
