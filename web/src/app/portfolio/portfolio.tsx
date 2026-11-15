"use client";

import Link from "next/link";
import { ChevronRight, Eye, EyeOff, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { RangeTabs, Sparkline } from "@/components/chart";
import { Screen } from "@/components/shell";
import {
  AssetDot,
  Card,
  Change,
  PreviewNote,
  SectionTitle,
} from "@/components/ui";
import {
  ASSETS,
  MARKETS,
  RANGES,
  agoLabel,
  amountLabel,
  sampleSeries,
  usd,
  type Asset,
  type AssetGroup,
  type Range,
} from "@/lib/data";
import { useStore } from "@/lib/store";
import { useCountUp } from "@/components/feel";
import { shortAddress } from "@/lib/wallet";

const GROUPS: {
  id: AssetGroup;
  title: string;
  short: string;
  color: string;
}[] = [
  {
    id: "stocks",
    title: "Stocks and real-world assets",
    short: "Stocks & RWAs",
    color: "#1F4F82",
  },
  { id: "crypto", title: "Crypto", short: "Crypto", color: "#C9A46A" },
  { id: "cash", title: "Cash", short: "Cash", color: "#8DB3DA" },
];
const PORTFOLIO_RANGES: Range[] = ["1D", "1W", "1M"];
const MASK = "$•••••";

function Row({
  asset,
  units,
  hidden = false,
}: {
  asset: Asset;
  units?: number;
  hidden?: boolean;
}) {
  const value = (units ?? 0) * asset.price;
  return (
    <Link
      href={`/portfolio/${asset.symbol}`}
      className="flex items-center gap-3 py-3"
    >
      <AssetDot symbol={asset.symbol} size={44} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[17px] font-semibold">
          {asset.name}
        </span>
        <span className="block text-[14px] text-muted">
          {units === undefined
            ? asset.symbol
            : hidden
              ? `••• ${asset.symbol}`
              : amountLabel(units, asset.symbol)}
        </span>
      </span>
      <span className="text-right">
        <span className="block font-mono text-[16px] font-semibold">
          {units !== undefined && hidden
            ? MASK
            : usd(units !== undefined ? value : asset.price, { cents: true })}
        </span>
        <Change pct={asset.change24h} className="text-[13px] font-medium" />
      </span>
    </Link>
  );
}

export function Portfolio() {
  const { me, holdings, totalUsd, hideBalances, toggleHideBalances } = useStore();
  const [range, setRange] = useState<Range>("1D");
  const [scrub, setScrub] = useState<number | null>(null);

  const valueOf = (a: Asset) => (holdings[a.symbol] ?? 0) * a.price;
  const held = ASSETS.filter((a) => (holdings[a.symbol] ?? 0) > 0).sort(
    (x, y) => valueOf(y) - valueOf(x),
  );
  // Markets you don't hold yet, biggest movers first.
  const rest = ASSETS.filter(
    (a) => !((holdings[a.symbol] ?? 0) > 0) && a.group !== "cash",
  ).sort((x, y) => Math.abs(y.change24h) - Math.abs(x.change24h));

  // What today's holdings would have been worth across the range.
  const series = useMemo(() => {
    const lines = ASSETS.filter((a) => (holdings[a.symbol] ?? 0) > 0).map((a) =>
      sampleSeries(a.symbol, 48, range).map(
        (v) => v * (holdings[a.symbol] ?? 0),
      ),
    );
    const points = lines[0]?.length ?? 0;
    return Array.from({ length: points }, (_, i) =>
      lines.reduce((sum, line) => sum + line[i], 0),
    );
  }, [holdings, range]);

  const point = scrub !== null && scrub < series.length ? scrub : null;
  const counted = useCountUp(totalUsd);
  const shown = point !== null ? series[point] : counted;
  const first = series[0] ?? totalUsd;
  const changeUsd = shown - first;
  const changePct = first ? (changeUsd / first) * 100 : 0;
  const up = changeUsd >= 0;
  const when =
    point !== null && point < series.length - 1
      ? `${agoLabel((1 - point / (series.length - 1)) * RANGES[range].minutes)} ago`
      : RANGES[range].words;

  const mix = GROUPS.map((g) => ({
    ...g,
    value: held
      .filter((a) => a.group === g.id)
      .reduce((sum, a) => sum + valueOf(a), 0),
  })).filter((g) => g.value > 0);

  return (
    <Screen>
      <div className="px-5 pt-8">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-medium text-muted">Portfolio</p>
          <div className="flex items-center gap-2">
            <Link
              href="/buy"
              className="flex h-10 items-center gap-1 rounded-full bg-brand px-4 text-[15px] font-semibold text-white"
            >
              <Plus size={17} strokeWidth={2.5} />
              Buy
            </Link>
            <button
              type="button"
              onClick={toggleHideBalances}
              aria-label={hideBalances ? "Show amounts" : "Hide amounts"}
              aria-pressed={hideBalances}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white"
            >
              {hideBalances ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>
        <p className="mt-1 text-[46px] font-semibold tabular-nums leading-none tracking-tight">
          {hideBalances ? MASK : usd(shown, { cents: true })}
        </p>
        <p className="mt-2 text-[15px] font-semibold">
          <span className={up ? "text-money" : "text-down"}>
            {!hideBalances &&
              `${up ? "+" : "−"}${usd(Math.abs(changeUsd), { cents: true })} `}
            {hideBalances ? (
              <Change pct={changePct} />
            ) : (
              `(${Math.abs(changePct).toFixed(2)}%)`
            )}
          </span>{" "}
          <span className="font-medium text-muted">{when}</span>
        </p>
      </div>
      <div className="px-4 pt-4">
        {series.length > 1 && (
          <Sparkline
            series={series}
            up={up}
            height={130}
            scrub={point}
            onScrub={setScrub}
          />
        )}
        <RangeTabs
          ranges={PORTFOLIO_RANGES}
          active={range}
          onChange={(r) => {
            setRange(r);
            setScrub(null);
          }}
        />
        <p className="pt-1 text-center text-[12px] text-muted">
          Sample chart, based on what you hold now. Drag along it to see a past
          value.
        </p>
      </div>

      {mix.length > 0 && (
        <div className="px-4 pt-5">
          <Card>
            <p className="text-[14px] font-medium text-muted">What you hold</p>
            <div
              className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label={mix
                .map(
                  (g) =>
                    `${g.short} ${Math.round((g.value / totalUsd) * 100)} percent`,
                )
                .join(", ")}
            >
              {mix.map((g) => (
                <span
                  key={g.id}
                  style={{
                    background: g.color,
                    flexGrow: g.value,
                    flexBasis: 0,
                    minWidth: 6,
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {mix.map((g) => (
                <span
                  key={g.id}
                  className="flex items-center gap-1.5 text-[13px]"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: g.color }}
                  />
                  <span className="font-medium">{g.short}</span>
                  <span className="font-mono font-semibold">
                    {Math.round((g.value / totalUsd) * 100)}%
                  </span>
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="px-4">
        {GROUPS.map((g) => {
          const rows = held.filter((a) => a.group === g.id);
          if (rows.length === 0) return null;
          const subtotal = rows.reduce(
            (s, a) => s + (holdings[a.symbol] ?? 0) * a.price,
            0,
          );
          return (
            <div key={g.id}>
              <SectionTitle
                right={
                  <span className="font-mono text-[13px] font-semibold text-muted">
                    {hideBalances ? MASK : usd(subtotal, { cents: true })}
                  </span>
                }
              >
                {g.title}
              </SectionTitle>
              <Card className="divide-y divide-line py-1">
                {rows.map((a) => (
                  <Row
                    key={a.symbol}
                    asset={a}
                    units={holdings[a.symbol]}
                    hidden={hideBalances}
                  />
                ))}
              </Card>
            </div>
          );
        })}

        <SectionTitle
          right={
            <Link
              href="/markets"
              className="text-[14px] font-semibold text-brand"
            >
              See all
            </Link>
          }
        >
          Markets · open 24/7
        </SectionTitle>
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
          {MARKETS.map((m) => (
            <Link
              key={m.id}
              href={`/markets?m=${m.id}`}
              className="flex h-9 shrink-0 items-center rounded-full bg-white px-4 text-[14px] font-semibold"
            >
              {m.label}
            </Link>
          ))}
        </div>
        <Card className="divide-y divide-line py-1">
          {rest.slice(0, 5).map((a) => (
            <Row key={a.symbol} asset={a} />
          ))}
          <Link
            href="/markets"
            className="flex h-12 items-center justify-center gap-1 text-[15px] font-semibold text-brand"
          >
            See all {ASSETS.length} markets <ChevronRight size={16} />
          </Link>
        </Card>

        <Link
          href="/me/settings"
          className="mt-4 flex items-center justify-center gap-1 text-[13px] text-muted"
        >
          Wallet {me.address ? shortAddress(me.address) : "not connected"} <ChevronRight size={14} />
        </Link>
      </div>
      <PreviewNote />
    </Screen>
  );
}
