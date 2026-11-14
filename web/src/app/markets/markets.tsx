"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { BackHeader, Screen } from "@/components/shell";
import { AssetDot, Card, Change } from "@/components/ui";
import { ASSETS, MARKETS, sampleSeries, usd, type Asset, type Market } from "@/lib/data";

type Filter = "all" | Market;
type Sort = "movers" | "price" | "name";

const SORTS: { id: Sort; label: string }[] = [
  { id: "movers", label: "Biggest moves" },
  { id: "price", label: "Price" },
  { id: "name", label: "A to Z" },
];

function priceLabel(a: Asset) {
  return usd(a.price, { cents: true });
}

/** A tiny line for the row, from the same sample path the asset page draws. */
function MiniLine({ symbol, up }: { symbol: string; up: boolean }) {
  const s = sampleSeries(symbol, 24, "1D");
  const min = Math.min(...s);
  const max = Math.max(...s);
  const span = max - min || 1;
  const d = s.map((v, i) => `${i === 0 ? "M" : "L"}${((i / (s.length - 1)) * 56).toFixed(1)},${(20 - ((v - min) / span) * 18 - 1).toFixed(1)}`).join(" ");
  return (
    <svg width="56" height="20" viewBox="0 0 56 20" aria-hidden className="shrink-0">
      <path d={d} fill="none" stroke={up ? "#2B8A57" : "#C8433A"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Markets() {
  const params = useSearchParams();
  const start = params.get("m");
  const [filter, setFilter] = useState<Filter>(MARKETS.some((m) => m.id === start) ? (start as Market) : "all");
  const [sort, setSort] = useState<Sort>("movers");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const list = ASSETS.filter((a) => (filter === "all" ? true : a.market === filter))
    .filter((a) => !q || a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q))
    .sort((x, y) => (sort === "movers" ? Math.abs(y.change24h) - Math.abs(x.change24h) : sort === "price" ? y.price - x.price : x.name.localeCompare(y.name)));

  const movers = [...ASSETS].filter((a) => a.group !== "cash").sort((x, y) => Math.abs(y.change24h) - Math.abs(x.change24h)).slice(0, 6);

  return (
    <Screen>
      <BackHeader title="Markets" fallback="/portfolio" />

      <div className="px-4">
        <div className="flex items-center gap-2 rounded-2xl bg-brand-soft px-4 py-3">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-money opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-money" />
          </span>
          <p className="text-[14px] leading-snug text-brand">
            <span className="font-semibold">Open 24/7.</span> Everything here trades on-chain, so buys and sells fill nights and weekends too.
          </p>
        </div>

        <label className="mt-3 flex h-12 items-center gap-2 rounded-full bg-white px-4">
          <Search size={18} className="text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search stocks, crypto, gold…" className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted" />
        </label>
      </div>

      {!q && filter === "all" && (
        <div className="pt-5">
          <p className="px-5 pb-2 text-[15px] font-semibold">Moving today</p>
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-1">
            {movers.map((a) => (
              <Link key={a.symbol} href={`/portfolio/${a.symbol}`} className="w-[132px] shrink-0 rounded-[22px] bg-white p-3.5">
                <AssetDot symbol={a.symbol} size={34} />
                <p className="mt-2 truncate text-[15px] font-semibold">{a.name}</p>
                <p className="font-mono text-[13px] text-muted">{priceLabel(a)}</p>
                <Change pct={a.change24h} className="mt-1 block text-[13px] font-semibold" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="sticky top-14 z-20 bg-page/95 pt-4 backdrop-blur">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {([{ id: "all", label: "All" }, ...MARKETS] as { id: Filter; label: string }[]).map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={filter === m.id}
              onClick={() => setFilter(m.id)}
              className={`h-9 shrink-0 rounded-full px-4 text-[14px] font-semibold ${filter === m.id ? "bg-ink text-white" : "bg-white text-ink"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-[13px] text-muted">
            {list.length} {list.length === 1 ? "market" : "markets"}
          </p>
          <div className="flex gap-1">
            {SORTS.map((s) => (
              <button key={s.id} type="button" onClick={() => setSort(s.id)} className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${sort === s.id ? "bg-chip text-ink" : "text-muted"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <Card className="divide-y divide-line !px-4 py-1">
          {list.map((a) => (
            <Link key={a.symbol} href={`/portfolio/${a.symbol}`} className="flex items-center gap-3 py-3">
              <AssetDot symbol={a.symbol} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold">{a.name}</span>
                <span className="block text-[13px] text-muted">{a.symbol}</span>
              </span>
              <MiniLine symbol={a.symbol} up={a.change24h >= 0} />
              <span className="w-[84px] text-right">
                <span className="block font-mono text-[14px] font-semibold">{priceLabel(a)}</span>
                <Change pct={a.change24h} className="block text-[12px] font-semibold" />
              </span>
            </Link>
          ))}
          {list.length === 0 && <p className="py-6 text-center text-[15px] text-muted">Nothing matches “{query}”.</p>}
        </Card>
        <p className="px-2 pt-3 text-center text-[12px] leading-snug text-muted">Demo: test tokens that follow real prices. Prices from Blockworks and CoinGecko, Nov 13–14.</p>
      </div>
    </Screen>
  );
}
