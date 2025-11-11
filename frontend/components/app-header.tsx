type AppHeaderProps = {
  className?: string;
};

export function AppHeader({ className = '' }: AppHeaderProps) {
  return (
    <header className={`text-center ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
        Universal Paymaster
      </p>
    </header>
  );
}
