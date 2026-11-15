"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Building2, Check, ChevronDown, ChevronLeft, CreditCard, Delete, Wallet, X } from "lucide-react";
import { AssetDot, PrimaryButton, Sheet } from "@/components/ui";
import { Confetti, SuccessCheck, haptic } from "@/components/feel";
import { ASSETS, MARKETS, amountLabel, assetOf, personOf, usd } from "@/lib/data";
import { useStore } from "@/lib/store";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];
const QUICK = [10, 25, 50, 100];

/**
 * Ways to pay. Who would run each one in production:
 * - Apple Pay, Google Pay, debit card, bank: Circle's Onramp (App Kit), which delivers USDC on Arc.
 * - Venmo, PayPal, Cash App: MoonPay (US only), which supports all three plus cards and Apple Pay.
 * - Another wallet: the user's own MetaMask / Phantom; USDC on other networks comes over with Circle's Bridge Kit.
 * The stock or coin itself is then bought from that USDC inside the app.
 */
type MethodId = "applepay" | "card" | "venmo" | "paypal" | "cashapp" | "bank" | "wallet" | "balance";
type Method = { id: MethodId; name: string; hint: string; badge: { bg: string; fg: string; text?: string; icon?: "card" | "bank" | "wallet" } };

const METHODS: Method[] = [
  { id: "applepay", name: "Apple Pay", hint: "Instant. Uses a debit card in your Apple Wallet.", badge: { bg: "#000000", fg: "#FFFFFF", text: "Pay" } },
  { id: "card", name: "Debit card", hint: "Instant. Visa or Mastercard.", badge: { bg: "#1F4F82", fg: "#FFFFFF", icon: "card" } },
  { id: "venmo", name: "Venmo", hint: "Instant. Pay from your Venmo balance or linked bank.", badge: { bg: "#008CFF", fg: "#FFFFFF", text: "V" } },
  { id: "paypal", name: "PayPal", hint: "Instant. Pay from your PayPal balance or linked bank.", badge: { bg: "#003087", fg: "#FFFFFF", text: "P" } },
  { id: "cashapp", name: "Cash App", hint: "Instant. Pay from your Cash App balance.", badge: { bg: "#00D632", fg: "#FFFFFF", text: "$" } },
  { id: "bank", name: "Bank account", hint: "1 to 3 business days. Lowest fees.", badge: { bg: "#EFE9DF", fg: "#14202E", icon: "bank" } },
  { id: "wallet", name: "MetaMask, Phantom or another wallet", hint: "Use crypto you already have. USDC on other networks is moved over for you.", badge: { bg: "#EFE9DF", fg: "#14202E", icon: "wallet" } },
];

function MethodBadge({ m, size = 40 }: { m: Method; size?: number }) {
  const { bg, fg, text, icon } = m.badge;
  const Icon = icon === "card" ? CreditCard : icon === "bank" ? Building2 : Wallet;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-bold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: text && text.length > 1 ? size * 0.33 : size * 0.45 }}
    >
      {text ?? <Icon size={size * 0.5} />}
    </span>
  );
}

function Spinner() {
  return <span aria-label="Working" className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />;
}

export function BuyFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const { holdings, buy, buyWithOutside } = useStore();

  const presetAsset = params.get("asset");
  const payTo = params.get("to");
  const payNote = params.get("note") ?? "";
  const payee = payTo ? personOf(payTo) : null;

  const [symbol, setSymbol] = useState<string | null>(presetAsset && ASSETS.some((a) => a.symbol === presetAsset) ? presetAsset : null);
  const [amount, setAmount] = useState(params.get("amount") ?? "");
  const [methodId, setMethodId] = useState<MethodId>("applepay");
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [step, setStep] = useState<"amount" | "review" | "working" | "done">("amount");

  const cash = holdings.USDC ?? 0;
  const value = Number(amount) || 0;
  const balanceMethod: Method = { id: "balance", name: "Your dollars", hint: `${usd(cash, { cents: true })} available in your portfolio.`, badge: { bg: "#E3ECF6", fg: "#1F4F82", text: "$" } };
  const allMethods = [...METHODS, balanceMethod];
  const method = allMethods.find((m) => m.id === methodId) ?? METHODS[0];
  const overBalance = methodId === "balance" && value > cash;
  const ready = symbol !== null && value >= 1 && !overBalance;

  const press = (k: string) => {
    haptic();
    if (k === "del") return setAmount((a) => a.slice(0, -1));
    setAmount((a) => {
      if (k === "." && a.includes(".")) return a;
      const [, dec] = a.split(".");
      if (dec !== undefined && dec.length >= 2) return a;
      if (a.replace(".", "").length >= 5) return a;
      if (a === "" && k === ".") return "0.";
      if (a === "0" && k !== ".") return k;
      return a + k;
    });
  };

  const close = () => (window.history.length > 1 ? router.back() : router.push("/portfolio"));

  const complete = () => {
    if (!symbol) return;
    setStep("working");
    window.setTimeout(() => {
      if (methodId === "balance") buy(symbol, value);
      else buyWithOutside(symbol, value);
      haptic("success");
      setStep("done");
    }, 1100);
  };

  // 1. Pick what to buy (skipped when an asset is passed in).
  if (!symbol) {
    const groups = MARKETS.map((m) => ({ title: m.label, items: ASSETS.filter((a) => a.market === m.id) }));
    return (
      <div className="min-h-app bg-page pb-10">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-page/95 px-3 backdrop-blur">
          <button type="button" aria-label="Close" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <X size={20} />
          </button>
          <span className="text-[17px] font-semibold">{payee ? `Buy something to send ${payee.first}` : "Buy"}</span>
          <span className="w-10" />
        </div>
        <p className="mx-4 mb-3 rounded-2xl bg-brand-soft px-4 py-2.5 text-[13px] text-brand"><span className="font-semibold">Open 24/7.</span> Buys fill on-chain any time, weekends included.</p>
        <div className="space-y-4 px-4 pt-2">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="px-2 pb-2 text-[14px] font-semibold text-muted">{g.title}</p>
              <div className="divide-y divide-line rounded-[28px] bg-white px-4">
                {g.items.map((a) => (
                  <button key={a.symbol} type="button" onClick={() => setSymbol(a.symbol)} className="flex w-full items-center gap-3 py-3 text-left">
                    <AssetDot symbol={a.symbol} size={40} />
                    <span className="flex-1">
                      <span className="block text-[16px] font-semibold">{a.name}</span>
                      <span className="block text-[13px] text-muted">{a.symbol}</span>
                    </span>
                    <span className="font-mono text-[15px] font-semibold">{usd(a.price, { cents: true })}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const asset = assetOf(symbol);
  const units = value / asset.price;

  // 4. Done.
  if (step === "done") {
    return (
      <div className="flex min-h-app flex-col items-center bg-white px-6 pt-24 text-center">
        <Confetti pieces={50} />
        <SuccessCheck />
        <p className="mt-6 text-[28px] font-semibold leading-tight tracking-tight">You bought {usd(value, { cents: value % 1 !== 0 })} of {asset.name}</p>
        <p className="mt-2 text-[16px] text-muted">{amountLabel(units, symbol)} is in your wallet.</p>
        <p className="mt-6 rounded-xl bg-chip px-3 py-2 text-[13px] text-muted">Demo: no money moved. In the real app the payment partner charges your {method.name}.</p>
        <div className="mt-auto w-full pb-[max(env(safe-area-inset-bottom),24px)]">
          {payee ? (
            <PrimaryButton onClick={() => router.push(`/pay?to=${payee.handle}&amount=${value}&note=${encodeURIComponent(payNote)}&asset=${symbol}&confirm=1`)}>
              Send it to {payee.first} now
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => router.push(`/pay?asset=${symbol}`)}>Send some to a friend</PrimaryButton>
          )}
          <Link href={`/portfolio/${symbol}`} className="mt-1 flex h-12 w-full items-center justify-center text-[16px] font-semibold text-brand">
            See it in my portfolio
          </Link>
        </div>
      </div>
    );
  }

  // 3. Review.
  if (step === "review" || step === "working") {
    const working = step === "working";
    return (
      <div className="flex min-h-app flex-col bg-white">
        <div className="flex h-14 items-center justify-between px-3">
          <button type="button" aria-label="Back" disabled={working} onClick={() => setStep("amount")} className="flex h-10 w-10 items-center justify-center rounded-full bg-chip">
            <ChevronLeft size={22} />
          </button>
          <span className="text-[17px] font-semibold">Review</span>
          <span className="w-10" />
        </div>
        <div className="flex flex-1 flex-col items-center px-6 pt-6 text-center">
          <AssetDot symbol={symbol} size={72} />
          <p className="mt-4 text-[17px] text-muted">Buy</p>
          <p className="mt-1 text-[56px] font-semibold leading-none tracking-tight">{usd(value, { cents: value % 1 !== 0 })}</p>
          <p className="mt-2 text-[17px] text-muted">
            of <span className="font-semibold text-ink">{asset.name}</span>
          </p>
          <div className="mt-8 w-full space-y-3 rounded-2xl border border-line p-4 text-left text-[15px]">
            <div className="flex items-center justify-between">
              <span className="text-muted">You get about</span>
              <span className="font-semibold">{amountLabel(units, symbol)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">Pay with</span>
              <span className="flex items-center gap-2 font-semibold">
                <MethodBadge m={method} size={24} />
                {method.id === "wallet" ? "Your wallet" : method.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Goes to</span>
              <span className="font-semibold">Your own wallet</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Fees</span>
              <span className="font-semibold">{methodId === "balance" ? "under 1¢ (estimate)" : "Shown by the partner first"}</span>
            </div>
          </div>
          <p className="mt-3 text-[13px] text-muted">Price can move a little before the buy goes through.</p>
        </div>
        <div className="px-4 pb-[max(env(safe-area-inset-bottom),24px)] pt-4">
          {methodId === "applepay" ? (
            <button type="button" disabled={working} onClick={complete} className="flex h-14 w-full items-center justify-center rounded-full bg-black text-[18px] font-semibold text-white disabled:opacity-60">
              {working ? <Spinner /> : "Buy with Apple Pay"}
            </button>
          ) : (
            <PrimaryButton disabled={working} onClick={complete}>
              {working ? <Spinner /> : `Buy ${usd(value, { cents: value % 1 !== 0 })} of ${asset.name}`}
            </PrimaryButton>
          )}
          <p className="mt-3 text-center text-[12px] text-muted">Demo: no real money moves.</p>
        </div>
      </div>
    );
  }

  // 2. Amount and payment method.
  return (
    <div className="flex min-h-app flex-col bg-white">
      <div className="flex h-14 items-center justify-between px-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => (presetAsset ? close() : setSymbol(null))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-chip"
        >
          {presetAsset ? <X size={20} /> : <ChevronLeft size={22} />}
        </button>
        <span className="flex items-center gap-2 text-[17px] font-semibold">
          <AssetDot symbol={symbol} size={24} />
          Buy {asset.name}
        </span>
        <span className="w-10" />
      </div>

      <div className="flex flex-col items-center px-6 pt-6">
        <p className={`tabular text-[64px] font-semibold leading-none tracking-tight ${value ? "" : "text-muted"}`}>${amount || "0"}</p>
        <p className="mt-2 h-5 text-[15px] text-muted">{value > 0 ? `about ${amountLabel(units, symbol)}` : `${usd(asset.price, { cents: true })} per ${symbol}`}</p>
        {payee && <p className="mt-2 rounded-full bg-brand-soft px-3 py-1 text-[13px] font-semibold text-brand">Then send it to {payee.first}</p>}
        <div className="mt-5 flex gap-2">
          {QUICK.map((q) => (
            <button key={q} type="button" onClick={() => setAmount(String(q))} className="h-9 rounded-full bg-chip px-4 text-[15px] font-semibold">
              ${q}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto px-4 pb-6 pt-4">
        <button type="button" onClick={() => setMethodsOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left">
          <MethodBadge m={method} size={36} />
          <span className="flex-1">
            <span className="block text-[13px] text-muted">Pay with</span>
            <span className="block text-[16px] font-semibold">{method.id === "wallet" ? "Your wallet" : method.name}</span>
          </span>
          <ChevronDown size={20} className="text-muted" />
        </button>
        {overBalance && <p className="mt-2 text-center text-[13px] font-medium text-down">You have {usd(cash, { cents: true })} in dollars. Pick another way to pay.</p>}
        <PrimaryButton className="mt-3" disabled={!ready} onClick={() => setStep("review")}>
          Review
        </PrimaryButton>
        <div className="mt-2 grid grid-cols-3">
          {KEYS.map((k) => (
            <button key={k} type="button" onClick={() => press(k)} className="flex h-12 items-center justify-center text-[24px] font-medium active:bg-chip">
              {k === "del" ? <Delete size={24} /> : k}
            </button>
          ))}
        </div>
      </div>

      <Sheet open={methodsOpen} onClose={() => setMethodsOpen(false)} title="Pay with">
        <div className="space-y-2">
          {allMethods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMethodId(m.id);
                setMethodsOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ${m.id === methodId ? "bg-brand-soft" : "bg-chip"}`}
            >
              <MethodBadge m={m} />
              <span className="flex-1">
                <span className="block text-[16px] font-semibold">{m.name}</span>
                <span className="block text-[13px] leading-snug text-muted">{m.hint}</span>
              </span>
              {m.id === methodId && <Check size={20} className="text-brand" />}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[12px] leading-snug text-muted">
          Sending and receiving never needs ID. Paying with a card, bank or Venmo goes through a licensed partner, which may ask for ID the first time. Paying from
          your own wallet doesn&apos;t. Credit cards aren&apos;t offered yet.
        </p>
      </Sheet>
    </div>
  );
}
