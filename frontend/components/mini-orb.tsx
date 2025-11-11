'use client';

import type { ReactNode } from 'react';

export type MiniOrbOption = {
  id: string;
  label: string;
  icon?: ReactNode;
  accent?: string;
  onSelect?: () => void;
};

type MiniOrbProps = {
  option: MiniOrbOption;
  index: number;
  isVisible: boolean;
  onSelect: () => void;
};

export function MiniOrb({ option, index, isVisible, onSelect }: MiniOrbProps) {
  const slideDelay = `${index * 60}ms`;
  const floatDelay = `${index * 0.6}s`;
  const accentBackground =
    option.accent ??
    'radial-gradient(circle at 32% 18%, rgba(255, 255, 255, 0.9), rgba(226, 232, 255, 0.15) 55%, rgba(129, 140, 248, 0.15))';

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={isVisible ? 0 : -1}
      aria-label={option.label}
      className="group/action relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-white outline-none transition duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 sm:h-12 sm:w-12 animate-float"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(1rem) scale(0.75)',
        pointerEvents: isVisible ? 'auto' : 'none',
        transitionDelay: slideDelay,
        animationDelay: floatDelay,
        animationDuration: '9s',
      }}
      onClick={onSelect}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 blur-2xl transition duration-300 group-hover/action:opacity-70 group-focus-visible/action:opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.65), rgba(59, 130, 246, 0.2), transparent 70%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full border border-white/40 opacity-90 transition duration-300 group-hover/action:opacity-100 group-focus-visible/action:opacity-100"
        style={{
          background: accentBackground,
          boxShadow:
            '0 18px 30px rgba(15, 23, 42, 0.18), inset 0 2px 8px rgba(255, 255, 255, 0.65), inset 0 -8px 14px rgba(79, 70, 229, 0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[3px] rounded-full border border-white/30 opacity-80 transition duration-300 group-hover/action:opacity-95"
        style={{
          background:
            'radial-gradient(circle at 35% 15%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.08) 65%)',
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.75)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-2 top-2 block h-4 w-8 rounded-full opacity-50 blur-[1px] transition duration-300 group-hover/action:opacity-70"
        style={{
          background:
            'radial-gradient(circle at 20% 60%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0))',
        }}
      />
      <span className="sr-only">{option.label}</span>
      <span className="relative z-10 flex h-full w-full items-center justify-center">
        {option.icon ?? (
          <span className="text-xs font-medium tracking-wide text-slate-900">
            {option.label.slice(0, 2)}
          </span>
        )}
      </span>
    </button>
  );
}
