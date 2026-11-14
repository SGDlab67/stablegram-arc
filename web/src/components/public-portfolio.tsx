"use client";

import Link from "next/link";
import { EyeOff, Lock, UsersRound } from "lucide-react";
import { ASSETS, usd, type PortfolioPrivacy } from "@/lib/data";
import { AssetDot, Card, Change } from "./ui";

const GROUP_COLORS: Record<string, { label: string; color: string }> = {
  stocks: { label: "Stocks & RWAs", color: "#1F4F82" },
  crypto: { label: "Crypto", color: "#C9A46A" },
  cash: { label: "Cash", color: "#8DB3DA" },
};

/**
 * A person's portfolio as other people see it, after their privacy choices.
 * `firstName` is used in the hidden-state messages; `canView` is false when it is friends-only and the viewer isn't a friend.
 */
export function PublicPortfolio({
  holdings,
  privacy,
  firstName,
  canView,
  self = false,
}: {
  holdings: Record<string, number>;
  privacy: PortfolioPrivacy;
  firstName: string;
  canView: boolean;
  self?: boolean;
}) {
  if (!privacy.show || !canView) {
    const friendsOnly = privacy.show && !canView;
    return (
      <Card className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-chip">
          {friendsOnly ? <UsersRound size={20} /> : <Lock size={20} />}
        </span>
        <p className="text-[15px] leading-snug text-muted">
          {self ? "Your portfolio is hidden. Others see only this message." : friendsOnly ? `${firstName} only shows their portfolio to friends.` : `${firstName} keeps their portfolio private.`}
        </p>
      </Card>
    );
  }

  const rows = ASSETS.map((a) => ({ a, value: (holdings[a.symbol] ?? 0) * a.price }))
    .filter((r) => r.value > 0.005)
    .sort((x, y) => y.value - x.value);
  const total = rows.reduce((s, r) => s + r.value, 0);
  const change = total ? rows.reduce((s, r) => s + r.value * (r.a.change24h / 100), 0) / total * 100 : 0;
  const mix = Object.keys(GROUP_COLORS)
    .map((g) => ({ g, value: rows.filter((r) => r.a.group === g).reduce((s, r) => s + r.value, 0) }))
    .filter((m) => m.value > 0);

  return (
    <Card>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[14px] font-medium text-muted">Total</p>
          {privacy.total ? (
            <p className="text-[30px] font-semibold tabular-nums leading-tight tracking-tight">{usd(total, { cents: true })}</p>
          ) : (
            <p className="flex items-center gap-1.5 text-[17px] font-semibold text-muted">
              <EyeOff size={16} /> Hidden
            </p>
          )}
        </div>
        {privacy.performance && (
          <p className="text-right text-[14px]">
            <Change pct={change} className="font-semibold" />
            <span className="block text-[12px] text-muted">today</span>
          </p>
        )}
      </div>

      {privacy.holdings && privacy.amounts !== "hidden" && mix.length > 0 && (
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
          {mix.map((m) => (
            <span key={m.g} style={{ width: `${(m.value / total) * 100}%`, background: GROUP_COLORS[m.g].color }} />
          ))}
        </div>
      )}

      {privacy.holdings ? (
        <div className="mt-2 divide-y divide-line">
          {rows.map(({ a, value }) => (
            <Link key={a.symbol} href={`/portfolio/${a.symbol}`} className="flex items-center gap-3 py-2.5">
              <AssetDot symbol={a.symbol} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{a.name}</span>
                <span className="block text-[12px] text-muted">{a.symbol}</span>
              </span>
              <span className="text-right">
                {privacy.amounts === "dollars" && <span className="block font-mono text-[14px] font-semibold">{usd(value, { cents: true })}</span>}
                {privacy.amounts === "percent" && <span className="block font-mono text-[14px] font-semibold">{Math.max(1, Math.round((value / total) * 100))}%</span>}
                {privacy.performance && <Change pct={a.change24h} className="block text-[12px] font-semibold" />}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-chip px-3 py-2.5 text-[14px] text-muted">
          <EyeOff size={15} /> {self ? "What you hold is hidden." : `${firstName} hides what they hold.`}
        </p>
      )}
    </Card>
  );
}
