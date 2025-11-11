'use client';

import { GlobeCanvas } from '@/components/globe-canvas';

const GlobePage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-950 via-slate-900 to-slate-950">
      <GlobeCanvas />
    </main>
  );
};

export default GlobePage;
