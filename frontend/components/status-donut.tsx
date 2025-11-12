'use client';

import { arc, pie, type PieArcDatum } from 'd3-shape';
import { useRef, useState } from 'react';

type DonutSlice = {
  id: string;
  label: string;
  value: number;
  display?: string;
};

type StatusDonutProps = {
  data: DonutSlice[];
  totalValue?: number;
};

const donutColors = [
  'rgba(99,102,241,0.95)',
  'rgba(59,130,246,0.9)',
  'rgba(16,185,129,0.9)',
  'rgba(249,115,22,0.9)',
  'rgba(236,72,153,0.85)',
  'rgba(190,24,93,0.85)',
];

const formatCompactCurrency = (value: number) => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

export function StatusDonut({ data, totalValue }: StatusDonutProps) {
  const safeData = Array.isArray(data) ? data.slice(0, 6) : [];
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    label: string;
    value: number;
    left: number;
    top: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const computedTotal =
    typeof totalValue === 'number'
      ? totalValue
      : safeData.reduce((sum, slice) => sum + slice.value, 0);

  const enrichedSlices =
    computedTotal === 0
      ? safeData.map((slice, index) => ({
          ...slice,
          percent: 0,
          color: donutColors[index % donutColors.length],
        }))
      : safeData.map((slice, index) => ({
          ...slice,
          percent: (slice.value / computedTotal) * 100,
          color: donutColors[index % donutColors.length],
        }));

  const arcData = pie<(typeof enrichedSlices)[number]>()
    .value((slice) => slice.value || 0.0001)
    .sort(null)(enrichedSlices);

  const arcGenerator = arc<PieArcDatum<(typeof enrichedSlices)[number]>>()
    .innerRadius(52)
    .outerRadius(70)
    .cornerRadius(18)
    .padAngle(0.015);

  return (
    <div
      ref={containerRef}
      className="reveal relative flex w-full max-w-[16rem] aspect-square items-center justify-center">
      <svg viewBox="-110 -110 220 220" className="h-full w-full text-slate-200">
        <defs>
          {arcData.map((segment, index) => (
            <linearGradient
              key={`gradient-${segment.data.id}`}
              id={`donut-gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%">
              <stop
                offset="0%"
                stopColor={segment.data.color}
                stopOpacity={0.45}
              />
              <stop
                offset="55%"
                stopColor={segment.data.color}
                stopOpacity={0.85}
              />
              <stop
                offset="100%"
                stopColor={segment.data.color}
                stopOpacity={1}
              />
            </linearGradient>
          ))}
          <filter id="donut-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="3"
              floodColor="rgba(255,255,255,0.45)"
            />
          </filter>
        </defs>
        <circle
          cx="0"
          cy="0"
          r="72"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="18"
        />
        <circle
          cx="0"
          cy="0"
          r="85"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeDasharray="2 12"
          strokeWidth="1.2"
          className="donut-ticks"
        />
        {arcData.map((segment, index) => {
          const isHighlighted = highlightId === segment.data.id;
          const path = arcGenerator(segment);
          const centroid = arcGenerator.centroid(segment);
          return path ? (
            <g key={segment.data.id}>
              <path
                pathLength={100}
                d={path}
                fill={`url(#donut-gradient-${index})`}
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                shapeRendering="geometricPrecision"
                className="donut-segment"
                filter={isHighlighted ? 'url(#donut-glow)' : 'none'}
                onMouseEnter={() => {
                  setHighlightId(segment.data.id);
                  if (!containerRef.current) {
                    return;
                  }
                  const rect = containerRef.current.getBoundingClientRect();
                  const [cx, cy] = centroid;
                  const left = ((cx + 110) / 220) * rect.width;
                  const top = ((cy + 110) / 220) * rect.height;
                  setTooltip({
                    label: segment.data.label.replace(/\s+/g, ''),
                    value: segment.data.value,
                    left,
                    top: Math.max(0, Math.min(top, rect.height - 8)),
                  });
                }}
                onMouseLeave={() => {
                  setHighlightId(null);
                  setTooltip(null);
                }}
                style={{
                  transformOrigin: 'center',
                  transformBox: 'fill-box',
                  transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 180ms ease-out, fill 180ms ease-out',
                  animationDelay: `${index * 90}ms`,
                }}
              />
            </g>
          ) : null;
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center donut-center">
        <div className="rounded-full text-center shadow-[inset_0_2px_12px_rgba(255,255,255,0.6)] backdrop-blur">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
            Total TVL
          </p>
          <p className="text-lg font-medium text-slate-900 tabular-nums">
            {formatCompactCurrency(computedTotal)}
          </p>
        </div>
      </div>

      {tooltip && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div
            className="absolute w-36 -translate-x-1/2 -translate-y-full rounded-2xl border border-white/60 bg-white/95 px-3 py-2 text-center shadow-lg"
            style={{
              left: tooltip.left,
              top: tooltip.top,
            }}>
            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
              {tooltip.label}
            </p>
            <p className="text-sm font-semibold text-slate-900 tabular-nums">
              {formatCompactCurrency(tooltip.value)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
