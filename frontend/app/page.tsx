import { AppHeader } from '@/components/app-header';
import { GlobeCanvas } from '@/components/globe';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-linear-to-b from-[#c5c4cf] via-[#b4c9db] to-white">
      <AppHeader className="pointer-events-none absolute top-10 left-1/2 w-full -translate-x-1/2 px-4 text-slate-400" />

      <div className="flex w-full h-full items-center justify-center pt-7">
        <GlobeCanvas />
      </div>
    </main>
  );
}
