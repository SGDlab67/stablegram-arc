"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Delete,
  Plus,
  QrCode,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Sentence } from "@/components/feed";
import {
  AssetDot,
  AudienceToggle,
  Avatar,
  Flag,
  PrimaryButton,
  Sheet,
} from "@/components/ui";
import { Confetti, SuccessCheck, haptic } from "@/components/feel";
import { countryName, flagOf } from "@/lib/countries";
import {
  ASSETS,
  NOTE_SHORTCUTS,
  amountLabel,
  assetOf,
  feeLabel,
  personOf,
  shortName,
  usd,
  type Audience,
  type Payment,
} from "@/lib/data";
import { useStore } from "@/lib/store";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];

/** Remount on every new link (e.g. coming back from Buy) so no old sheet or step is left open. */
export function PayFlow() {
  const params = useSearchParams();
  return <PayFlowInner key={params.toString()} />;
}

function PayFlowInner() {
  const router = useRouter();
  const params = useSearchParams();
  const store = useStore();
  const { me, people, friends, holdings, payments, defaultAudience } = store;

  const presetTo = params.get("to");
  const requestId = params.get("request") ?? undefined;
  const [recipients, setRecipients] = useState<string[]>(
    presetTo ? [presetTo] : [],
  );
  const [step, setStep] = useState<"who" | "amount" | "confirm" | "done">(
    presetTo
      ? params.get("confirm") === "1" &&
        params.get("asset") &&
        params.get("amount")
        ? "confirm"
        : "amount"
      : "who",
  );
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState(params.get("amount") ?? "");
  const [note, setNote] = useState(params.get("note") ?? "");
  const [audience, setAudience] = useState<Audience>(defaultAudience);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [payAsset, setPayAsset] = useState<string | null>(params.get("asset"));
  const [done, setDone] = useState<
    | { kind: "paid"; payment: Payment }
    | { kind: "requested"; each: number }
    | null
  >(null);

  const value = Number.parseFloat(amount || "0") || 0;
  const split = recipients.length > 1;
  const each = split
    ? Math.round((value / (recipients.length + 1)) * 100) / 100
    : value;
  const ready = value > 0 && note.trim().length > 0 && recipients.length > 0;
  const first = recipients[0] ? personOf(recipients[0], people) : null;

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    const others = people.filter(
      (p) => p.handle !== me.handle && !recipients.includes(p.handle),
    );
    if (!q) {
      // A new account has no friends yet. Show everyone rather than an empty list.
      const mine = others.filter((p) => friends.includes(p.handle));
      return mine.length > 0 ? mine : others;
    }
    return others.filter(
      (p) =>
        p.handle.includes(q) ||
        `${p.first} ${p.last}`.toLowerCase().includes(q),
    );
  }, [query, people, me.handle, friends, recipients]);
  // People you paid or were paid by most recently, for one-tap repeat payments.
  const recent = useMemo(() => {
    const seen: string[] = [];
    for (const pay of payments) {
      const other =
        pay.from === me.handle
          ? pay.to
          : pay.to === me.handle
            ? pay.from
            : null;
      if (other && !seen.includes(other) && !recipients.includes(other))
        seen.push(other);
    }
    return seen.slice(0, 6);
  }, [payments, me.handle, recipients]);
  // Two people with the same display name: show the country in words too, so the flag can't be missed.
  const sameName = (x: { handle: string; first: string; last: string }) =>
    people.some(
      (o) =>
        o.handle !== x.handle &&
        o.first.toLowerCase() === x.first.toLowerCase() &&
        o.last.toLowerCase() === x.last.toLowerCase(),
    );
  const morePeople = people.filter(
    (p) =>
      p.handle !== me.handle &&
      !recipients.includes(p.handle) &&
      !candidates.some((c) => c.handle === p.handle),
  );

  const funded = useMemo(
    () =>
      ASSETS.map((a) => ({
        asset: a,
        units: holdings[a.symbol] ?? 0,
        value: (holdings[a.symbol] ?? 0) * a.price,
      }))
        .filter((h) => h.units > 0)
        .sort((a, b) => b.value - a.value),
    [holdings],
  );
  // Holdings that cover the amount come first, largest first; the rest are listed but greyed out.
  const choices = [...funded].sort(
    (a, b) =>
      Number(b.value >= value) - Number(a.value >= value) || b.value - a.value,
  );
  const chosen =
    payAsset &&
    funded.some((h) => h.asset.symbol === payAsset && h.value + 0.005 >= value)
      ? payAsset
      : null;

  const startPay = () => {
    // Coming from an asset's "Send some" button, that asset is already picked: go straight to confirm.
    if (chosen) setStep("confirm");
    else setConfirmOpen(true);
  };
  const pickAsset = (symbol: string) => {
    setPayAsset(symbol);
    setConfirmOpen(false);
    setStep("confirm");
  };
  const firstTime = first
    ? !payments.some((p) => p.from === me.handle && p.to === first.handle)
    : false;

  const [shakeKey, setShakeKey] = useState(0);
  const press = (k: string) => {
    haptic();
    if (k === "del") return setAmount((a) => a.slice(0, -1));
    const a = amount;
    const [, dec] = a.split(".");
    const blocked =
      (k === "." && a.includes(".")) ||
      (dec !== undefined && dec.length >= 2) ||
      a.replace(".", "").length >= 6;
    if (blocked) {
      haptic("warn");
      setShakeKey((n) => n + 1);
      return;
    }
    setAmount(
      a === "" && k === "." ? "0." : a === "0" && k !== "." ? k : a + k,
    );
  };

  const choose = (handle: string) => {
    setRecipients((r) => (r.includes(handle) ? r : [...r, handle]));
    setQuery("");
    setAdding(false);
    setStep("amount");
  };

  const doRequest = () => {
    store.request(recipients, each, note.trim());
    haptic("success");
    setDone({ kind: "requested", each });
    setStep("done");
  };

  const doPay = () => {
    if (!chosen || !first) return;
    const payment = store.pay({
      to: first.handle,
      usd: value,
      note: note.trim(),
      audience,
      asset: chosen,
      requestId,
    });
    setConfirmOpen(false);
    haptic("success");
    setDone({ kind: "paid", payment });
    setStep("done");
  };

  if (step === "done" && done) {
    return (
      <div className="flex min-h-app flex-col items-center justify-center bg-white px-8 text-center">
        {done.kind === "paid" && <Confetti />}
        <SuccessCheck
          color={done.kind === "paid" ? "var(--money)" : "var(--brand)"}
        />
        {done.kind === "paid" ? (
          <div className="mt-8">
            <Sentence p={done.payment} />
            <p className="mt-4 text-[15px] text-muted">
              You sent{" "}
              {amountLabel(
                done.payment.usd / assetOf(done.payment.asset).price,
                done.payment.asset,
              )}
              . It&apos;s in {personOf(done.payment.to, people).first}&apos;s
              wallet now, to keep or sell.
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Fee {feeLabel(done.payment.feeUsd)} (estimate)
            </p>
          </div>
        ) : (
          <p className="mt-8 text-[26px] font-medium leading-tight tracking-tight">
            Requested {usd(done.each)} from{" "}
            {recipients.map((h) => personOf(h, people).first).join(", ")}
          </p>
        )}
        <PrimaryButton className="mt-10" onClick={() => router.push("/")}>
          Done
        </PrimaryButton>
        {done.kind === "paid" && (
          <Link
            href={`/p/${done.payment.ref}`}
            className="mt-2 flex h-12 w-full items-center justify-center text-[16px] font-semibold text-brand"
          >
            See the payment
          </Link>
        )}
      </div>
    );
  }

  if (step === "confirm" && first && chosen) {
    const a = assetOf(chosen);
    const units = value / a.price;
    return (
      <div className="flex min-h-app flex-col bg-white">
        <div className="flex h-14 items-center justify-between px-3">
          <button
            type="button"
            aria-label="Back"
            onClick={() => {
              setStep("amount");
              setConfirmOpen(true);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-chip"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="text-[17px] font-semibold">Confirm</span>
          <span className="w-10" />
        </div>

        <div className="flex flex-1 flex-col items-center px-6 pt-4 text-center">
          <span className="relative">
            <Avatar handle={first.handle} size={80} />
            <span className="pop absolute -bottom-1 -right-2 rounded-full ring-4 ring-white">
              <AssetDot symbol={chosen} size={34} />
            </span>
          </span>
          <p className="mt-3 text-[17px] text-muted">
            Pay{" "}
            <span className="font-semibold text-ink">
              {first.first} {first.last}
            </span>{" "}
            <Flag code={first.country} size={16} />
          </p>
          <p className="mt-1 text-[56px] font-semibold leading-none tracking-tight">
            {usd(value)}
          </p>
          <p className="mt-3 text-[17px] text-muted">with</p>
          <div className="mt-3 flex items-center gap-3 rounded-full bg-chip py-2 pl-2 pr-5">
            <AssetDot symbol={chosen} size={44} />
            <span className="text-left">
              <span className="block text-[19px] font-semibold leading-tight">
                {a.name}
              </span>
              <span className="block text-[14px] text-muted">
                {amountLabel(units, chosen)}
              </span>
            </span>
          </div>

          <div className="mt-6 w-full space-y-2.5 rounded-2xl border border-line p-4 text-left text-[15px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted">For</span>
              <span className="truncate font-semibold">{note.trim()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">{first.first} gets</span>
              <span className="font-semibold">
                {amountLabel(units, chosen)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Who can see it</span>
              <AudienceToggle value={audience} onChange={setAudience} />
            </div>
            <p className="text-[12px] leading-snug text-muted">
              {audience === "public"
                ? "Shows in feeds. The amount stays between you two."
                : "Only you and " +
                  first.first +
                  " see it in the app. The transfer is still on a public blockchain."}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-muted">Arrives</span>
              <span className="font-semibold">
                In seconds, in {first.first}&apos;s wallet
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Fee</span>
              <span className="font-semibold">under 1¢ (estimate)</span>
            </div>
          </div>
          <p className="mt-3 text-[13px] text-muted">
            {first.first} can keep it or sell it for dollars any time.
          </p>
          {firstTime && (
            <p className="mt-3 w-full rounded-xl bg-brand-soft px-3 py-2 text-[14px] font-medium text-brand">
              First time paying @{first.handle}
              {first.country
                ? ` in ${countryName(first.country)} ${flagOf(first.country)}`
                : ""}
              . Check the name, photo and flag.
            </p>
          )}
        </div>

        <div className="px-4 pb-[max(env(safe-area-inset-bottom),24px)] pt-4">
          <PrimaryButton onClick={doPay}>
            Pay {usd(value)} with {a.name}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => {
              setStep("amount");
              setConfirmOpen(true);
            }}
            className="mt-1 h-12 w-full text-[16px] font-semibold text-brand"
          >
            Pay with something else
          </button>
        </div>
      </div>
    );
  }

  if (step === "who" || adding) {
    return (
      <div className="min-h-app bg-white">
        <div className="flex h-14 items-center justify-between px-3">
          <button
            type="button"
            aria-label="Close"
            onClick={() => (adding ? setAdding(false) : router.push("/"))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-chip"
          >
            <X size={20} />
          </button>
          <span className="text-[17px] font-semibold">
            {adding ? "Add someone" : "Pay or request"}
          </span>
          <span className="w-10" />
        </div>
        <div className="flex items-center gap-2 px-4 pt-2">
          <label className="flex h-14 flex-1 items-center gap-3 rounded-full bg-chip px-5">
            <Search size={20} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or @username"
              className="w-full bg-transparent text-[17px] outline-none placeholder:text-muted"
            />
          </label>
          <Link
            href="/me/code"
            aria-label="Scan a code"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-chip"
          >
            <QrCode size={22} />
          </Link>
        </div>
        {!query && recent.length > 0 && (
          <>
            <p className="px-5 pb-2 pt-6 text-[13px] font-semibold uppercase tracking-wide text-muted">
              Recent
            </p>
            <div className="no-scrollbar flex gap-4 overflow-x-auto px-5">
              {recent.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => choose(h)}
                  className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                >
                  <Avatar handle={h} size={58} />
                  <span className="w-full truncate text-center text-[13px] font-medium">
                    {personOf(h, people).first}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        <p className="px-5 pb-1 pt-6 text-[13px] font-semibold uppercase tracking-wide text-muted">
          {query || friends.length === 0 ? "People" : "Friends"}
        </p>
        <ul>
          {candidates.map((p) => (
            <li key={p.handle}>
              <button
                type="button"
                onClick={() => choose(p.handle)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left active:bg-chip"
              >
                <Avatar handle={p.handle} size={48} />
                <span className="flex-1">
                  <span className="flex items-center gap-1.5 text-[17px] font-semibold">
                    {p.first} {p.last} <Flag code={p.country} size={15} />
                  </span>
                  <span className="block text-[15px] text-muted">
                    @{p.handle}
                    {sameName(p) && p.country && (
                      <span className="font-medium text-ink">
                        {" "}
                        · {countryName(p.country)}
                      </span>
                    )}
                  </span>
                </span>
                <ChevronRight size={18} className="text-line" />
              </button>
            </li>
          ))}
          {candidates.length === 0 && (
            <li className="px-5 py-6 text-muted">Nobody by that name yet.</li>
          )}
        </ul>
        {!query && morePeople.length > 0 && (
          <>
            <p className="px-5 pb-1 pt-5 text-[13px] font-semibold uppercase tracking-wide text-muted">
              More people
            </p>
            <ul>
              {morePeople.map((p) => (
                <li key={p.handle}>
                  <button
                    type="button"
                    onClick={() => choose(p.handle)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left active:bg-chip"
                  >
                    <Avatar handle={p.handle} size={48} />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 text-[17px] font-semibold">
                        {p.first} {p.last} <Flag code={p.country} size={15} />
                      </span>
                      <span className="block text-[15px] text-muted">
                        @{p.handle}
                        {sameName(p) && p.country && (
                          <span className="font-medium text-ink">
                            {" "}
                            · {countryName(p.country)}
                          </span>
                        )}
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-line" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="h-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-app flex-col bg-white">
      <div className="flex h-14 items-center justify-between px-3">
        <button
          type="button"
          aria-label="Close"
          onClick={() => router.push("/")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-chip"
        >
          <X size={20} />
        </button>
        <span className="w-10" />
      </div>

      <div className="flex flex-col items-center px-6 pt-2">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-3">
            {recipients.slice(0, 4).map((h) => (
              <Avatar key={h} handle={h} size={64} ring />
            ))}
          </div>
          <button
            type="button"
            aria-label="Add another person"
            onClick={() => setAdding(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-chip"
          >
            <Plus size={20} />
          </button>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[20px] font-semibold">
          {split
            ? `${recipients.length} people`
            : first
              ? `${first.first} ${first.last}`
              : ""}{" "}
          {!split && first && <Flag code={first.country} size={18} />}
        </p>
        <p className="text-[15px] text-muted">
          {split
            ? recipients.map((h) => `@${h}`).join("  ")
            : first
              ? `@${first.handle}`
              : ""}
        </p>

        <div
          key={shakeKey}
          className={`mt-5 flex items-start justify-center font-semibold tracking-tight tabular ${shakeKey ? "shake" : ""}`}
        >
          <span className="mt-2 text-[28px]">$</span>
          <span
            className={`leading-none transition-[font-size] duration-150 ${amount ? "text-ink" : "text-line"}`}
            style={{
              fontSize:
                (amount || "0").length > 6
                  ? 58
                  : (amount || "0").length > 4
                    ? 66
                    : 76,
            }}
          >
            {amount || "0"}
          </span>
        </div>
        {split && value > 0 && (
          <p className="mt-1 text-[15px] text-muted">
            {usd(each, { cents: true })} each, split with you
          </p>
        )}

        <label className="mt-5 flex min-h-14 w-full items-center rounded-2xl border border-line px-4">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 140))}
            placeholder="What's it for?"
            className="w-full bg-transparent py-3 text-[17px] outline-none placeholder:text-muted"
          />
        </label>
        <div className="no-scrollbar -mx-6 mt-2 flex w-[calc(100%+3rem)] gap-1 overflow-x-auto px-6">
          {NOTE_SHORTCUTS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() =>
                setNote((n) =>
                  (n.includes(e)
                    ? n
                    : `${e} ${n}`.trim() + (n ? "" : " ")
                  ).slice(0, 140),
                )
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-xl"
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto px-4 pb-6 pt-4">
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!ready}
            onClick={doRequest}
            className="h-14 flex-1 rounded-full bg-brand text-lg font-semibold text-white disabled:opacity-40"
          >
            Request
          </button>
          <button
            type="button"
            disabled={!ready || split}
            onClick={startPay}
            className="h-14 flex-1 rounded-full bg-brand text-lg font-semibold text-white disabled:opacity-40"
          >
            Pay
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className="flex h-14 items-center justify-center text-[26px] font-medium active:bg-chip"
            >
              {k === "del" ? <Delete size={26} /> : k}
            </button>
          ))}
        </div>
      </div>

      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={
          first ? `Pay ${shortName(first)} ${usd(value)} with…` : "Pay with…"
        }
      >
        <p className="-mt-2 mb-3 text-[14px] text-muted">
          Pick what to send. They get exactly that.
        </p>
        {[
          {
            title: "Stablecoins",
            list: choices.filter((h) => h.asset.group === "cash"),
          },
          {
            title: "From your portfolio",
            list: choices.filter((h) => h.asset.group !== "cash"),
          },
        ]
          .filter((g) => g.list.length > 0)
          .map(({ title, list }) => (
            <div key={title} className="mb-3">
              <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
                {title}
              </p>
              <div className="space-y-2">
                {list.map((h) => {
                  const enough = h.value + 0.005 >= value;
                  return (
                    <button
                      key={h.asset.symbol}
                      type="button"
                      disabled={!enough}
                      onClick={() => pickAsset(h.asset.symbol)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-chip p-3 text-left active:bg-brand-soft disabled:opacity-35"
                    >
                      <AssetDot symbol={h.asset.symbol} size={40} />
                      <span className="flex-1">
                        <span className="block text-[16px] font-semibold">
                          {h.asset.name}
                        </span>
                        <span className="block text-[13px] text-muted">
                          {enough
                            ? amountLabel(h.units, h.asset.symbol)
                            : "Not enough for this payment"}
                        </span>
                      </span>
                      <span className="font-mono text-[15px] font-semibold">
                        {usd(h.value, { cents: true })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        {first && (
          <Link
            href={`/buy?amount=${value}&to=${first.handle}&note=${encodeURIComponent(note)}`}
            className="mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-full border border-line text-[15px] font-semibold text-brand"
          >
            <Plus size={17} strokeWidth={2.5} />
            Buy something to send
          </Link>
        )}
      </Sheet>
    </div>
  );
}
