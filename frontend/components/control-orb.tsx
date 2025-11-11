'use client';

export function ControlOrb() {
  return (
    <button
      type="button"
      title="Open control center"
      className="group fixed bottom-6 right-6 z-50 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-transparent outline-none transition-transform duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 sm:h-20 sm:w-20"
      aria-label="Open control center">
      <span className="sr-only">Open control center</span>

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
  );
}
