'use client';

import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type SlideOverProps = {
  isOpen: boolean;
  onClose?: () => void;
  ariaLabel: string;
  children: ReactNode;
  panelClassName?: string;
};

export function SlideOver({
  isOpen,
  onClose,
  ariaLabel,
  children,
  panelClassName = '',
}: SlideOverProps) {
  const portalNode =
    typeof document === 'undefined' ? null : (document.body as HTMLElement);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!portalNode) {
    return null;
  }

  const overlayClasses = [
    'fixed inset-0 z-40 h-full w-full bg-slate-900/20 backdrop-blur transition-opacity duration-200',
    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
  ].join(' ');

  const panelClasses = [
    'fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white/90 p-6 shadow-[0_35px_100px_rgba(15,23,42,0.2)] backdrop-blur-lg transition-transform duration-200 ease-out sm:p-8',
    isOpen ? 'translate-x-0' : 'translate-x-full',
    panelClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Dismiss panel"
        className={overlayClasses}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={panelClasses}>
        {children}
      </aside>
    </>,
    portalNode
  );
}
