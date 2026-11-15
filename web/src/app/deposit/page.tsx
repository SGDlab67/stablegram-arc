"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ArrowDownToLine, Building2, ChevronRight, Copy, CreditCard, Info } from "lucide-react";
import { Suspense, useState } from "react";
import { BackHeader, Screen } from "@/components/shell";
import { AssetDot, Card, SectionTitle } from "@/components/ui";
import { haptic, toast } from "@/components/feel";
import { ASSETS, assetOf, usd } from "@/lib/data";
import { shortAddress } from "@/lib/wallet";
import { useStore } from "@/lib/store";

/** Circle's coins exist on Arc testnet; the other stablecoins are demo tokens there. */
const NATIVE_ON_ARC = ["USDC", "EURC"];

function DepositScreen() {
  const params = useSearchParams();
  const { me, holdings, deposit } = useStore();
  const stables = ASSETS.filter((a) => a.group === "cash");
  const start = params.get("coin");
  const [coin, setCoin] = useState(stables.some((a) => a.symbol === start) ? (start as string) : "USDC");
  const a = assetOf(coin);
  const address = me.address ?? "";
  const balance = stables.reduce((sum, s) => sum + (holdings[s.symbol] ?? 0) * s.price, 0);

  return (
    <Screen tabs={false}>
      <BackHeader title="Add money" fallback="/portfolio" />
      <div className="px-4 pb-10">
        <div className="flex items-center justify-between rounded-[22px] bg-white px-4 py-3">
          <span className="text-[14px] text-muted">Stablecoins you hold</span>
          <span className="tabular text-[17px] font-semibold">{usd(balance, { cents: true })}</span>
        </div>

        <SectionTitle>Buy with money you have</SectionTitle>
        <Card className="divide-y divide-line !py-1">
          <Link href={`/buy?asset=${coin}`} className="flex items-center gap-3 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-[13px] font-bold text-white">Pay</span>
            <span className="flex-1">
              <span className="block text-[16px] font-semibold">Apple Pay or debit card</span>
              <span className="block text-[13px] text-muted">Instant. Lands as {a.symbol} in your wallet.</span>
            </span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
          <Link href={`/buy?asset=${coin}`} className="flex items-center gap-3 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#008CFF] text-[17px] font-bold text-white">V</span>
            <span className="flex-1">
              <span className="block text-[16px] font-semibold">Venmo, PayPal or Cash App</span>
              <span className="block text-[13px] text-muted">US only. Through a payment partner.</span>
            </span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
          <Link href={`/buy?asset=${coin}`} className="flex items-center gap-3 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-chip">
              <Building2 size={19} />
            </span>
            <span className="flex-1">
              <span className="block text-[16px] font-semibold">Bank account</span>
              <span className="block text-[13px] text-muted">1 to 3 days. Lowest fees.</span>
            </span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        </Card>

        <SectionTitle>Deposit stablecoins</SectionTitle>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {stables.map((s) => (
            <button
              key={s.symbol}
              type="button"
              aria-pressed={coin === s.symbol}
              onClick={() => {
                haptic();
                setCoin(s.symbol);
              }}
              className={`flex h-11 shrink-0 items-center gap-2 rounded-full pl-1.5 pr-4 text-[15px] font-semibold ${coin === s.symbol ? "bg-ink text-white" : "bg-white"}`}
            >
              <AssetDot symbol={s.symbol} size={30} />
              {s.symbol}
            </button>
          ))}
        </div>

        <Card className="mt-3 flex flex-col items-center text-center">
          <div className="relative rounded-2xl bg-white p-2 ring-1 ring-line">
            {address ? <QRCodeSVG value={address} size={188} level="H" fgColor="#14202E" /> : <div className="h-[188px] w-[188px]" />}
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-white">
              <AssetDot symbol={coin} size={40} />
            </span>
          </div>
          <p className="mt-3 text-[15px] font-semibold">
            Your {a.symbol} address on <span className="text-brand">Arc</span>
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(address);
              haptic();
              toast("Address copied");
            }}
            className="selectable mt-1 flex items-center gap-1.5 rounded-full bg-chip px-3.5 py-2 font-mono text-[14px]"
          >
            {address ? shortAddress(address) : "No wallet yet"} <Copy size={14} className="text-muted" />
          </button>
          <p className="mt-3 flex gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-left text-[13px] leading-snug text-brand">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>
              Send only <b>{a.symbol}</b> on the <b>Arc</b> network to this address.
              {coin === "USDC" ? " Coming from Ethereum, Base or Solana? USDC can be moved over with Circle's bridge (coming soon)." : ""}
              {!NATIVE_ON_ARC.includes(coin) ? ` ${a.symbol} is a demo token on Arc testnet.` : ""}
            </span>
          </p>
          <button
            type="button"
            onClick={() => {
              const units = 25 / a.price;
              deposit(coin, units);
              haptic("success");
              toast(`${a.symbol === "EURC" ? "€" : "$"}25 ${a.symbol} arrived · settled in seconds`);
            }}
            className="mt-4 flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-white"
          >
            <ArrowDownToLine size={17} /> Simulate a $25 deposit
          </button>
          <p className="mt-2 text-[12px] text-muted">Demo button. Real deposits show up on their own.</p>
        </Card>

        <SectionTitle>From an exchange</SectionTitle>
        <Card className="flex gap-3">
          <CreditCard size={20} className="mt-0.5 shrink-0 text-brand" />
          <p className="text-[14px] leading-snug text-muted">
            Withdraw {a.symbol} from Coinbase, Kraken or any exchange to the address above. Pick the <b className="text-ink">Arc</b> network if the exchange offers it.
          </p>
        </Card>
      </div>
    </Screen>
  );
}

export default function DepositPage() {
  return (
    <Suspense fallback={<div className="min-h-app" />}>
      <DepositScreen />
    </Suspense>
  );
}
