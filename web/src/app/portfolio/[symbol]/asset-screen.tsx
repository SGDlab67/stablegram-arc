"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { RangeTabs, Sparkline } from "@/components/chart";
import { ActivityRow } from "@/components/feed";
import { BackHeader, Screen } from "@/components/shell";
import { AssetDot, Card, Change, GhostButton, PrimaryButton, SectionTitle, Sheet } from "@/components/ui";
import { ASSETS, RANGES, agoLabel, amountLabel, sampleSeries, usd, type Range } from "@/lib/data";
import { useStore } from "@/lib/store";

const QUICK = [1, 5, 10, 25];
const ASSET_RANGES: Range[] = ["1D", "1W", "1M", "6M", "1Y", "All"];

export function AssetScreen() {
  const { symbol } = useParams<{ symbol: string }>();
  const { holdings, payments, me, receivePref, setReceivePref, buy, sell } = useStore();
  const [trade, setTrade] = useState<"buy" | "sell" | null>(null);
  const [range, setRange] = useState<Range>("1D");
  const [scrub, setScrub] = useState<number | null>(null);
  const asset = ASSETS.find((a) => a.symbol === symbol?.toUpperCase());

  if (!asset) {
    return (
      <Screen>
        <BackHeader title="Asset" fallback="/portfolio" />
        <p className="p-8 text-center text-muted">We don&apos;t list that one.</p>
      </Screen>
    );
  }

  const units = holdings[asset.symbol] ?? 0;
  const value = units * asset.price;
  const cash = holdings.USDC ?? 0;
  const mine = payments.filter((p) => (p.from === me.handle && p.payAsset === asset.symbol) || (p.to === me.handle && p.receiveAsset === asset.symbol));
  const isPref = receivePref === asset.symbol;
  const isDollar = asset.symbol === "USDC";

  const series = sampleSeries(asset.symbol, 48, range);
  const point = scrub !== null && scrub < series.length ? scrub : null;
  const shown = point !== null ? series[point] : asset.price;
  const changePct = ((shown - series[0]) / series[0]) * 100;
  const when = point !== null && point < series.length - 1 ? `${agoLabel((1 - point / (series.length - 1)) * RANGES[range].minutes)} ago` : RANGES[range].words;

  return (
    <Screen>
      <BackHeader title={asset.symbol} fallback="/portfolio" />
      <div className="px-5 pt-2">
        <div className="flex items-center gap-3">
          <AssetDot symbol={asset.symbol} size={52} />
          <div>
            <p className="flex items-center gap-2 text-[22px] font-semibold">
              {asset.name}
              {asset.demo && <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase text-muted">demo</span>}
            </p>
            <p className="text-[14px] text-muted">{asset.symbol}</p>
          </div>
        </div>
        <p className="mt-4 text-[40px] font-semibold tabular-nums leading-none tracking-tight">{usd(shown, { cents: true })}</p>
        <p className="mt-2 text-[15px] font-semibold">
          <Change pct={changePct} /> <span className="font-medium text-muted">{when}</span>
        </p>
      </div>
      <div className="px-4 pt-4">
        <Sparkline series={series} up={changePct >= 0} height={150} scrub={point} onScrub={setScrub} />
        <RangeTabs
          ranges={ASSET_RANGES}
          active={range}
          onChange={(r) => {
            setRange(r);
            setScrub(null);
          }}
        />
        <p className="pt-1 text-center text-[12px] text-muted">{range === "1D" ? "Sample chart. Today's change is real; the line is drawn." : "Sample chart. Changes beyond one day are made up."}</p>
      </div>

      <div className="space-y-3 px-4 pt-5">
        <Card>
          <p className="text-[14px] font-medium text-muted">You hold</p>
          <p className="mt-1 text-[22px] font-semibold">{amountLabel(units, asset.symbol)}</p>
          <p className="text-[15px] text-muted">about {usd(value, { cents: true })}</p>
          {!isDollar && (
            <div className="mt-4 flex gap-3">
              <PrimaryButton className="h-12 flex-1" onClick={() => setTrade("buy")}>
                Buy
              </PrimaryButton>
              <PrimaryButton className="h-12 flex-1" disabled={units === 0} onClick={() => setTrade("sell")}>
                Sell
              </PrimaryButton>
            </div>
          )}
          <button
            type="button"
            onClick={() => setReceivePref(isPref ? null : asset.symbol)}
            className={`mt-3 flex h-12 w-full items-center justify-center rounded-full text-[16px] font-semibold ${isPref ? "bg-brand-soft text-brand" : "bg-chip text-ink"}`}
          >
            {isPref ? "✓ You get paid in this" : "Get paid in this"}
          </button>
        </Card>

        <Card>
          <p className="text-[14px] font-medium text-muted">About</p>
          <p className="mt-1 text-[16px] leading-relaxed">{asset.about}</p>
          {asset.demo && <p className="mt-2 text-[14px] text-muted">Test token that follows the real price.</p>}
        </Card>
      </div>

      {mine.length > 0 && (
        <div className="px-4">
          <SectionTitle>Your activity in {asset.symbol}</SectionTitle>
          <Card className="divide-y divide-line py-1">
            {mine.map((p) => (
              <ActivityRow key={p.ref} p={p} />
            ))}
          </Card>
        </div>
      )}

      <Sheet open={trade !== null} onClose={() => setTrade(null)} title={trade === "buy" ? `Buy ${asset.name}` : `Sell ${asset.name}`}>
        <p className="-mt-2 mb-4 text-[14px] text-muted">
          {trade === "buy" ? `You have ${usd(cash, { cents: true })} in dollars.` : `You hold about ${usd(value, { cents: true })}.`}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK.map((d) => {
            const limit = trade === "buy" ? cash : value;
            return (
              <GhostButton
                key={d}
                className={`h-14 text-[17px] ${d > limit ? "opacity-35" : ""}`}
                onClick={() => {
                  if (d > limit) return;
                  if (trade === "buy") buy(asset.symbol, d);
                  else sell(asset.symbol, d);
                  setTrade(null);
                }}
              >
                ${d}
              </GhostButton>
            );
          })}
        </div>
        <p className="mt-4 text-center text-[13px] text-muted">
          {usd(1)} is about {amountLabel(1 / asset.price, asset.symbol)}
        </p>
      </Sheet>
    </Screen>
  );
}
