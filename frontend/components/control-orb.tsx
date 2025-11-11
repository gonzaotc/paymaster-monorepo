'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MiniOrb } from './mini-orb';
import type { MiniOrbOption } from './mini-orb';

type OrbOption = MiniOrbOption;

type ControlOrbProps = {
  options?: OrbOption[];
};

const buildDefaultOptions = (navigate: (path: string) => void): OrbOption[] => [
  {
    id: 'swap',
    label: 'Swap assets',
    accent:
      'radial-gradient(circle at 30% 20%, rgba(236, 254, 255, 0.9), rgba(191, 219, 254, 0.35) 55%, rgba(167, 139, 250, 0.25))',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 text-slate-900/80 drop-shadow"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path d="M7 7l-3 3 3 3" />
        <path d="M4 10h9a3 3 0 003-3V6" />
        <path d="M17 17l3-3-3-3" />
        <path d="M20 14H11a3 3 0 01-3 3v1" />
      </svg>
    ),
    onSelect: () => navigate('/transfer'),
  },
  {
    id: 'pools',
    label: 'View pools',
    accent:
      'radial-gradient(circle at 40% 15%, rgba(245, 243, 255, 0.95), rgba(199, 210, 254, 0.4) 55%, rgba(129, 140, 248, 0.25))',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 text-indigo-900/80 drop-shadow"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round">
        <ellipse cx="12" cy="7" rx="6" ry="3" />
        <path d="M6 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" />
        <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      </svg>
    ),
    onSelect: () => navigate('/pools'),
  },
];

export function ControlOrb({ options }: ControlOrbProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const router = useRouter();
  const resolvedOptions =
    options ?? buildDefaultOptions((path) => router.push(path));
  const panelMaxHeight = `${Math.max(resolvedOptions.length, 1) * 84}px`;

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPanelOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPanelOpen]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-5 sm:gap-6">
      <div
        id={panelId}
        role="menu"
        aria-hidden={!isPanelOpen}
        aria-label="Control orb shortcuts"
        className="flex max-w-full flex-col items-center gap-5 transition-[max-height,opacity,transform] duration-300 ease-out"
        style={{
          maxHeight: isPanelOpen ? panelMaxHeight : 0,
          opacity: isPanelOpen ? 1 : 0,
          transform: isPanelOpen ? 'translateY(0)' : 'translateY(0.75rem)',
        }}>
        {resolvedOptions.map((option, index) => (
          <MiniOrb
            key={option.id}
            option={option}
            index={index}
            isVisible={isPanelOpen}
            onSelect={() => {
              option.onSelect?.();
              setIsPanelOpen(false);
            }}
          />
        ))}
      </div>

      <button
        type="button"
        title="Open control center"
        aria-label="Open control center"
        aria-expanded={isPanelOpen}
        aria-controls={panelId}
        onClick={() => setIsPanelOpen((prev) => !prev)}
        className="group flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-transparent outline-none transition-transform duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 sm:h-20 sm:w-20">
        <span className="sr-only">Toggle control shortcuts</span>

        <div className="relative flex h-full w-full items-center justify-center">
          <div className="relative h-16 w-16 animate-float sm:h-20 sm:w-20">
            {/* Diffused outer glow to lift orb from the surface */}
            <div
              className="pointer-events-none absolute -inset-3 rounded-full opacity-85 blur-[26px]"
              style={{
                background:
                  'radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.18) 45%, transparent 70%), radial-gradient(circle at 75% 70%, rgba(168, 85, 247, 0.45) 0%, rgba(129, 140, 248, 0.25) 45%, transparent 75%)',
              }}
            />

            {/* Glass shell */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  'linear-gradient(145deg, rgba(255, 255, 255, 0.92) 5%, rgba(241, 245, 249, 0.35) 50%, rgba(129, 140, 248, 0.2) 85%)',
                boxShadow:
                  '0 22px 48px rgba(15, 23, 42, 0.18), inset 0 2px 9px rgba(255, 255, 255, 0.6), inset 0 -10px 18px rgba(79, 70, 229, 0.2)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            />

            {/* Refractive edge */}
            <div
              className="pointer-events-none absolute inset-[3px] rounded-full border border-white/20"
              style={{
                background:
                  'radial-gradient(circle at 35% 15%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.05) 60%)',
                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8)',
              }}
            />

            {/* Concave inner lens */}
            <div
              className="pointer-events-none absolute inset-[7px] rounded-full border border-white/30"
              style={{
                background:
                  'radial-gradient(circle at 30% 20%, rgba(240, 249, 255, 0.8), rgba(232, 231, 253, 0.15) 40%), radial-gradient(circle at 70% 130%, rgba(216, 180, 254, 0.55), rgba(125, 211, 252, 0.35), rgba(37, 99, 235, 0.2))',
                boxShadow:
                  'inset 0 12px 20px rgba(255, 255, 255, 0.45), inset 0 -20px 32px rgba(99, 102, 241, 0.28)',
                opacity: 0.92,
              }}
            />

            {/* Specular highlights */}
            <span
              className="pointer-events-none absolute left-3 top-2 block h-3 w-10 rounded-full opacity-75 blur-[0.6px]"
              style={{
                background:
                  'radial-gradient(circle at 25% 65%, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0))',
              }}
            />
            <span
              className="pointer-events-none absolute right-3 bottom-3 block h-4 w-8 rotate-30 rounded-full opacity-35"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0))',
                boxShadow: '0 6px 11px rgba(79, 70, 229, 0.28)',
              }}
            />

            {/* Control icon */}
            <div className="relative z-10 flex h-full w-full items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition duration-300 group-hover:shadow-[inset_0_3px_12px_rgba(255,255,255,0.9),0_16px_38px_rgba(79,70,229,0.45)] sm:h-12 sm:w-12">
                <svg
                  className="h-6 w-6 text-white drop-shadow-md transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="M12 6h7" />
                  <path d="M5 18h7" />
                  <circle cx="8" cy="6" r="1.8" />
                  <circle cx="16" cy="12" r="1.8" />
                  <circle cx="11" cy="18" r="1.8" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
