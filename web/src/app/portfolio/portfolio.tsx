"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { RangeTabs, Sparkline } from "@/components/chart";
import { Screen } from "@/components/shell";
import { AssetDot, Card, Change, PreviewNote, SectionTitle, Sheet } from "@/components/ui";
import { ASSETS, amountLabel, sampleSeries, usd, type Asset, type AssetGroup } from "@/lib/data";
import { useStore } from "@/lib/store";

const GROUPS: { id: AssetGroup; title: string }[] = [
  { id: "stocks", title: "Stocks and real-world assets" },
  { id: "crypto", title: "Crypto" },
  { id: "cash", title: "Cash" },
];

function Row({ asset, units }: { asset: Asset; units?: number }) {
  const value = (units ?? 0) * asset.price;
  return (
    <Link href={`/portfolio/${asset.symbol}`} className="flex items-center gap-3 py-3">
      <AssetDot symbol={asset.symbol} size={44} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[17px] font-semibold">
          {asset.name}
          {asset.demo && <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-semibold uppercase text-muted">demo</span>}
        </span>
        <span className="block text-[14px] text-muted">{units !== undefined ? amountLabel(units, asset.symbol) : asset.symbol}</span>
      </span>
      <span className="text-right">
        <span className="block font-mono text-[16px] font-semibold">{usd(units !== undefined ? value : asset.price, { cents: true })}</span>
        <Change pct={asset.change24h} className="text-[13px] font-medium" />
      </span>
    </Link>
  );
}

export function Portfolio() {
  const params = useSearchParams();
  const { holdings, totalUsd, receivePref, setReceivePref } = useStore();
  const [picker, setPicker] = useState(params.get("paidin") === "1");

  const held = ASSETS.filter((a) => (holdings[a.symbol] ?? 0) > 0);
  const rest = ASSETS.filter((a) => !((holdings[a.symbol] ?? 0) > 0));

  const { changeUsd, changePct, series } = useMemo(() => {
    let before = 0;
    for (const a of held) before += ((holdings[a.symbol] ?? 0) * a.price) / (1 + a.change24h / 100);
    const total = held.reduce((s, a) => s + (holdings[a.symbol] ?? 0) * a.price, 0);
    const each = held.map((a) => sampleSeries(a.symbol).map((v) => v * (holdings[a.symbol] ?? 0)));
    const points = each[0]?.length ?? 0;
    const sum = Array.from({ length: points }, (_, i) => each.reduce((s, line) => s + line[i], 0));
    return { changeUsd: total - before, changePct: before ? ((total - before) / before) * 100 : 0, series: sum };
  }, [held, holdings]);

  const pref = receivePref ? ASSETS.find((a) => a.symbol === receivePref) : null;

  return (
    <Screen>
      <div className="px-5 pt-8">
        <p className="text-[15px] font-medium text-muted">Portfolio</p>
        <p className="mt-1 font-mono text-[46px] font-semibold leading-none tracking-tight">{usd(totalUsd, { cents: true })}</p>
        <p className={`mt-2 text-[15px] font-semibold ${changeUsd >= 0 ? "text-money" : "text-down"}`}>
          {changeUsd >= 0 ? "+" : "−"}
          {usd(Math.abs(changeUsd), { cents: true })} ({Math.abs(changePct).toFixed(2)}%) today
        </p>
      </div>
      <div className="px-4 pt-4">
        {series.length > 1 && <Sparkline series={series} up={changeUsd >= 0} height={130} />}
        <RangeTabs ranges={["1D", "1W", "1M"]} active="1D" />
        <p className="pt-1 text-center text-[12px] text-muted">Sample chart, based on what you hold now</p>
      </div>

      <div className="px-4 pt-5">
        <button type="button" onClick={() => setPicker(true)} className="flex w-full items-center gap-3 rounded-[28px] bg-white p-5 text-left">
          {pref ? <AssetDot symbol={pref.symbol} size={48} /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-chip text-xl">↔</span>}
          <span className="flex-1">
            <span className="block text-[14px] font-medium text-muted">Get paid in</span>
            <span className="block text-[20px] font-semibold">{pref ? pref.name : "Whatever I'm sent"}</span>
          </span>
          <span className="rounded-full bg-brand-soft px-4 py-2 text-[15px] font-semibold text-brand">Change</span>
        </button>
      </div>

      <div className="px-4">
        {GROUPS.map((g) => {
          const rows = held.filter((a) => a.group === g.id);
          if (rows.length === 0) return null;
          const subtotal = rows.reduce((s, a) => s + (holdings[a.symbol] ?? 0) * a.price, 0);
          return (
            <div key={g.id}>
              <SectionTitle right={<span className="font-mono text-[13px] font-semibold text-muted">{usd(subtotal, { cents: true })}</span>}>{g.title}</SectionTitle>
              <Card className="divide-y divide-line py-1">
                {rows.map((a) => (
                  <Row key={a.symbol} asset={a} units={holdings[a.symbol]} />
                ))}
              </Card>
            </div>
          );
        })}

        <SectionTitle>Explore</SectionTitle>
        <Card className="divide-y divide-line py-1">
          {rest.map((a) => (
            <Row key={a.symbol} asset={a} />
          ))}
        </Card>

        <Link href="/me/settings" className="mt-4 flex items-center justify-center gap-1 text-[13px] text-muted">
          Wallet 0x71C4…9A3f (sample) <ChevronRight size={14} />
        </Link>
      </div>
      <PreviewNote />

      <Sheet open={picker} onClose={() => setPicker(false)} title="Get paid in">
        <p className="-mt-2 mb-3 text-[14px] text-muted">Whatever a friend pays with, it arrives as this.</p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setReceivePref(null);
              setPicker(false);
            }}
            className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ${receivePref === null ? "bg-brand-soft" : "bg-chip"}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg">↔</span>
            <span className="flex-1 text-[16px] font-semibold">Whatever I&apos;m sent</span>
            {receivePref === null && <Check size={20} className="text-brand" />}
          </button>
          {ASSETS.map((a) => (
            <button
              key={a.symbol}
              type="button"
              onClick={() => {
                setReceivePref(a.symbol);
                setPicker(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ${receivePref === a.symbol ? "bg-brand-soft" : "bg-chip"}`}
            >
              <AssetDot symbol={a.symbol} size={40} />
              <span className="flex-1">
                <span className="block text-[16px] font-semibold">{a.name}</span>
                <span className="block text-[13px] text-muted">{usd(a.price, { cents: true })}</span>
              </span>
              {receivePref === a.symbol && <Check size={20} className="text-brand" />}
            </button>
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}
