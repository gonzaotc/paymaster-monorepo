'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/tooltip';

type InfoBadgeProps = {
  content: ReactNode;
  className?: string;
};

export function InfoBadge({ content, className }: InfoBadgeProps) {
  return (
    <Tooltip content={content} className={className}>
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-[0.6rem] font-semibold leading-none text-slate-500 shadow-[0_2px_6px_rgba(15,23,42,0.08)]">
        i
      </span>
    </Tooltip>
  );
}
