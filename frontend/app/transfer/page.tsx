import { TransferForm } from '@/components/transfer-form';

const panelClass =
  'rounded-[2rem] bg-white/95 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] sm:p-8';

export default function TransferPage() {
  return (
    <div className="flex w-full flex-1 h-full">
      <section className={`${panelClass} w-full space-y-10`}>
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
            TRANSFER
          </p>
          <h2 className="text-2xl mt-2 font-semibold text-slate-900">
            Send funds using the{' '}
            <span className="italic font-medium">Universal Paymaster</span>
          </h2>
          <p className="text-sm text-slate-600">
            Complete your transfer and decide the token to use to pay for the
            gas.
          </p>
        </div>

        <TransferForm />
      </section>
    </div>
  );
}
