'use client';

import { useEffect, useRef, useState } from 'react';

type CountUpValueProps = {
  value: string;
  durationMs?: number;
};

const numberPattern = /([-+]?\d[\d,]*(?:\.\d+)?)/;

export function CountUpValue({ value, durationMs = 1200 }: CountUpValueProps) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const match = value.match(numberPattern);
    if (!match) {
      rafRef.current = requestAnimationFrame(() => setDisplay(value));
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }

    const numericPart = match[0];
    const prefix = value.slice(0, match.index ?? 0);
    const suffix = value.slice((match.index ?? 0) + numericPart.length);
    const decimalDigits = numericPart.includes('.')
      ? (numericPart.split('.')[1]?.length ?? 0)
      : 0;
    const target = parseFloat(numericPart.replace(/,/g, ''));

    if (!Number.isFinite(target)) {
      rafRef.current = requestAnimationFrame(() => setDisplay(value));
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }

    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
    });

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = easeOut(progress);
      const current = target * eased;
      setDisplay(`${prefix}${formatter.format(current)}${suffix}`);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(() => {
      setDisplay(`${prefix}${formatter.format(0)}${suffix}`);
      rafRef.current = requestAnimationFrame(tick);
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]);

  return <span>{display}</span>;
}
