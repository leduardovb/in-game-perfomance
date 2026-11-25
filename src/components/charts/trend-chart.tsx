"use client";

import { useId, useState, type PointerEvent } from "react";
import { formatValue, type ValueFormat } from "@/lib/format";

export type TrendChartPoint = { label: string; value: number };

const WIDTH = 320;
const HEIGHT = 120;
const PAD = { top: 12, right: 8, bottom: 8, left: 8 };

type Props = {
  title: string;
  /** Oldest first. */
  points: TrendChartPoint[];
  format: ValueFormat;
};

/** Single-series line chart with a crosshair tooltip. The title names the series, so no legend. */
export function TrendChart({ title, points, format }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();

  if (points.length < 2) {
    return (
      <figure className="rounded-xl border border-border bg-surface p-3">
        <figcaption className="text-sm font-medium">{title}</figcaption>
        <p className="mt-2 text-sm text-muted">Jogue mais partidas para ver a evolução.</p>
      </figure>
    );
  }

  const values = points.map((point) => point.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (index / (points.length - 1)) * innerWidth;
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * innerHeight;
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`).join(" ");

  const shown = active ?? points.length - 1;
  const last = points[points.length - 1];

  function handlePointer(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const svgX = ratio * WIDTH;
    const index = Math.round(((svgX - PAD.left) / innerWidth) * (points.length - 1));
    setActive(Math.min(Math.max(index, 0), points.length - 1));
  }

  return (
    <figure className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-baseline justify-between gap-2">
        <figcaption id={titleId} className="text-sm font-medium">
          {title}
        </figcaption>
        <p className="text-right text-sm" aria-live="polite">
          <span className="font-semibold">{formatValue(points[shown].value, format)}</span>
          <span className="ml-1.5 text-muted">{points[shown].label}</span>
        </p>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-2 w-full touch-none overflow-visible"
        role="img"
        aria-labelledby={titleId}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => setActive(null)}
      >
        <desc>{`De ${formatValue(points[0].value, format)} para ${formatValue(last.value, format)} em ${points.length} pontos`}</desc>
        {[min, max].map((value) => (
          <line
            key={value}
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={y(value)}
            y2={y(value)}
            className="stroke-border"
            strokeWidth={1}
          />
        ))}
        <path d={path} fill="none" className="stroke-accent" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {active !== null && (
          <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="stroke-muted" strokeWidth={1} />
        )}
        <circle
          cx={x(shown)}
          cy={y(points[shown].value)}
          r={4}
          className="fill-accent stroke-surface"
          strokeWidth={2}
        />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{points[0].label}</span>
        <span>
          mín {formatValue(Math.min(...values), format)} · máx {formatValue(Math.max(...values), format)}
        </span>
        <span>{last.label}</span>
      </div>
    </figure>
  );
}
