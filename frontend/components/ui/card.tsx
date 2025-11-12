'use client';

import type { ReactNode } from 'react';

type CardProps = {
  kicker: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  kickerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  unstyled?: boolean;
};

export function Card({
  kicker,
  title,
  description,
  children,
  className,
  bodyClassName,
  kickerClassName,
  titleClassName,
  descriptionClassName,
  unstyled = false,
}: CardProps) {
  const baseClass = unstyled
    ? ''
    : 'rounded-3xl border border-white/70 bg-white/95 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-2xl';
  const rootClassName = [baseClass, className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      <div className="space-y-0.5">
        <p
          className={[
            'text-[11px] font-semibold uppercase tracking-[0.5em] text-slate-500',
            kickerClassName,
          ]
            .filter(Boolean)
            .join(' ')}>
          {kicker}
        </p>
        {title && (
          <p
            className={['text-lg font-semibold  text-slate-900', titleClassName]
              .filter(Boolean)
              .join(' ')}>
            {title}
          </p>
        )}
        {description && (
          <p
            className={['text-xs text-slate-500', descriptionClassName]
              .filter(Boolean)
              .join(' ')}>
            {description}
          </p>
        )}
      </div>
      <div className={['mt-4', bodyClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
    </div>
  );
}
