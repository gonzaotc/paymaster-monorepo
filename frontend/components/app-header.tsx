type AppHeaderProps = {
  className?: string;
};

export function AppHeader({ className = '' }: AppHeaderProps) {
  return (
    <header className={`text-center ${className}`.trim()}>
      <p className="text-sm font-medium uppercase tracking-[0.6em] text-slate-500">
        Universal Paymaster
      </p>
    </header>
  );
}
