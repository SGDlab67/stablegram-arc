"use client";

import type { PointerEvent } from "react";
import type { Range } from "@/lib/data";

/**
 * A line chart. Pass `onScrub` to let a finger or the mouse run along it:
 * it reports the index of the point under the pointer, or null when it leaves.
 */
export function Sparkline({
  series,
  up,
  height = 120,
  scrub = null,
  onScrub,
}: {
  series: number[];
  up: boolean;
  height?: number;
  scrub?: number | null;
  onScrub?: (index: number | null) => void;
}) {
  const w = 360;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const pts = series.map((v, i) => [(i / (series.length - 1)) * w, height - 8 - ((v - min) / span) * (height - 16)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  const color = up ? "var(--money)" : "var(--down)";
  const last = pts[pts.length - 1];
  const mark = scrub !== null && pts[scrub] ? pts[scrub] : null;

  const at = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    onScrub?.(Math.round(t * (series.length - 1)));
  };
  const handlers = onScrub
    ? {
        onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          at(e);
        },
        onPointerMove: at,
        onPointerUp: (e: PointerEvent<SVGSVGElement>) => {
          // A finger lifting ends the scrub. A mouse keeps showing the point it hovers.
          if (e.pointerType !== "mouse") onScrub(null);
        },
        onPointerLeave: () => onScrub(null),
        onPointerCancel: () => onScrub(null),
      }
    : {};

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className="w-full"
      preserveAspectRatio="none"
      // Sideways drags scrub the chart; up-and-down drags still scroll the screen.
      style={{ height, touchAction: onScrub ? "pan-y" : undefined, cursor: onScrub ? "crosshair" : undefined }}
      aria-hidden
      {...handlers}
    >
      <path d={area} fill={color} opacity={0.08} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {mark ? (
        <>
          <line x1={mark[0]} x2={mark[0]} y1={0} y2={height} stroke="var(--ink)" strokeWidth={1} opacity={0.35} vectorEffect="non-scaling-stroke" />
          <circle cx={mark[0]} cy={mark[1]} r={5} fill="var(--ink)" stroke="white" strokeWidth={2} />
        </>
      ) : (
        <circle cx={last[0] - 3} cy={last[1]} r={4} fill={color} />
      )}
    </svg>
  );
}

export function RangeTabs<R extends Range>({ ranges, active, onChange }: { ranges: R[]; active: R; onChange: (range: R) => void }) {
  return (
    <div className={`flex px-1 pt-2 text-[13px] font-semibold text-muted ${ranges.length > 4 ? "justify-between" : "justify-center gap-3"}`}>
      {ranges.map((r) => (
        <button key={r} type="button" onClick={() => onChange(r)} aria-pressed={r === active} className={`h-8 min-w-11 rounded-full px-3 ${r === active ? "bg-ink text-white" : ""}`}>
          {r}
        </button>
      ))}
    </div>
  );
}
