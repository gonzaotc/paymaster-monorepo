import { TransferForm } from '@/components/transfer-form';

const panelClass =
  'rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-8';

export default function TransferPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className={`${panelClass} space-y-8`}>
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
              Send funds
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Build a transfer instruction
            </h2>
            <p className="text-sm text-slate-600">
              Pick any supported asset, set the amount, and decide which token
              will settle the paymaster bill.
            </p>
          </div>
          <TransferForm />
        </section>
      </div>
    </main>
  );
}
