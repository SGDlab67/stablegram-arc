import { sampleSeries } from "@/lib/data";

export function Sparkline({ series, up, height = 120 }: { series: number[]; up: boolean; height?: number }) {
  const w = 360;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const pts = series.map((v, i) => [(i / (series.length - 1)) * w, height - 8 - ((v - min) / span) * (height - 16)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  const color = up ? "var(--money)" : "var(--down)";
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }} aria-hidden>
      <path d={area} fill={color} opacity={0.08} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0] - 3} cy={last[1]} r={4} fill={color} />
    </svg>
  );
}

export function AssetChart({ symbol, up, height }: { symbol: string; up: boolean; height?: number }) {
  return <Sparkline series={sampleSeries(symbol)} up={up} height={height} />;
}

export function RangeTabs({ ranges, active }: { ranges: string[]; active: string }) {
  return (
    <div className="flex justify-between px-1 pt-2 text-[13px] font-semibold text-muted">
      {ranges.map((r) => (
        <span key={r} className={`rounded-full px-3 py-1 ${r === active ? "bg-ink text-white" : ""}`}>
          {r}
        </span>
      ))}
    </div>
  );
}
