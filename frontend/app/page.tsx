import { AppHeader } from '@/components/app-header';
import { GlobeCanvas } from '@/components/globe';

export default function Home() {
  return (
    <main className="absolute inset-0 flex h-screen w-screen flex-col overflow-hidden">
      <AppHeader className="pointer-events-none absolute top-10 left-1/2 w-full -translate-x-1/2 px-4 text-slate-400" />

      <div className="flex h-full w-full items-center justify-center">
        <GlobeCanvas />
      </div>
    </main>
  );
}
