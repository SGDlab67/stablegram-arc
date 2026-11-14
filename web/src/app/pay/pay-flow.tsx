"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Delete, Plus, QrCode, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Sentence } from "@/components/feed";
import { AssetDot, AudienceLabel, Avatar, PrimaryButton, Sheet } from "@/components/ui";
import { ASSETS, NOTE_SHORTCUTS, amountLabel, assetOf, feeLabel, personOf, shortName, usd, type Audience, type Payment } from "@/lib/data";
import { useStore } from "@/lib/store";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];
const AUDIENCES: { id: Audience; hint: string }[] = [
  { id: "public", hint: "Anyone can see it in feeds" },
  { id: "friends", hint: "Your friends and theirs" },
  { id: "private", hint: "Hidden from feeds. The transfer is still visible on the blockchain." },
];

export function PayFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const store = useStore();
  const { me, people, friends, holdings, payments, defaultAudience } = store;

  const presetTo = params.get("to");
  const requestId = params.get("request") ?? undefined;
  const [recipients, setRecipients] = useState<string[]>(presetTo ? [presetTo] : []);
  const [step, setStep] = useState<"who" | "amount" | "done">(presetTo ? "amount" : "who");
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState(params.get("amount") ?? "");
  const [note, setNote] = useState(params.get("note") ?? "");
  const [audience, setAudience] = useState<Audience>(defaultAudience);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [payAsset, setPayAsset] = useState<string | null>(params.get("asset"));
  const [done, setDone] = useState<{ kind: "paid"; payment: Payment } | { kind: "requested"; each: number } | null>(null);

  const value = Number.parseFloat(amount || "0") || 0;
  const split = recipients.length > 1;
  const each = split ? Math.round((value / (recipients.length + 1)) * 100) / 100 : value;
  const ready = value > 0 && note.trim().length > 0 && recipients.length > 0;
  const first = recipients[0] ? personOf(recipients[0], people) : null;

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    const others = people.filter((p) => p.handle !== me.handle && !recipients.includes(p.handle));
    if (!q) {
      // A new account has no friends yet. Show everyone rather than an empty list.
      const mine = others.filter((p) => friends.includes(p.handle));
      return mine.length > 0 ? mine : others;
    }
    return others.filter((p) => p.handle.includes(q) || `${p.first} ${p.last}`.toLowerCase().includes(q));
  }, [query, people, me.handle, friends, recipients]);

  const funded = useMemo(
    () =>
      ASSETS.map((a) => ({ asset: a, units: holdings[a.symbol] ?? 0, value: (holdings[a.symbol] ?? 0) * a.price }))
        .filter((h) => h.units > 0)
        .sort((a, b) => b.value - a.value),
    [holdings],
  );
  const preferred = funded.find((h) => h.asset.symbol === payAsset && h.value >= value);
  const chosen = preferred?.asset.symbol ?? funded.find((h) => h.value >= value)?.asset.symbol ?? null;
  const firstTime = first ? !payments.some((p) => p.from === me.handle && p.to === first.handle) : false;

  const press = (k: string) => {
    if (k === "del") return setAmount((a) => a.slice(0, -1));
    setAmount((a) => {
      if (k === "." && a.includes(".")) return a;
      const [, dec] = a.split(".");
      if (dec !== undefined && dec.length >= 2) return a;
      if (a.replace(".", "").length >= 6) return a;
      if (a === "" && k === ".") return "0.";
      if (a === "0" && k !== ".") return k;
      return a + k;
    });
  };

  const choose = (handle: string) => {
    setRecipients((r) => (r.includes(handle) ? r : [...r, handle]));
    setQuery("");
    setAdding(false);
    setStep("amount");
  };

  const doRequest = () => {
    store.request(recipients, each, note.trim());
    setDone({ kind: "requested", each });
    setStep("done");
  };

  const doPay = () => {
    if (!chosen || !first) return;
    const payment = store.pay({ to: first.handle, usd: value, note: note.trim(), audience, asset: chosen, requestId });
    setConfirmOpen(false);
    setDone({ kind: "paid", payment });
    setStep("done");
  };

  if (step === "done" && done) {
    return (
      <div className="flex min-h-app flex-col items-center justify-center bg-white px-8 text-center">
        <span className="pop flex h-24 w-24 items-center justify-center rounded-full bg-money text-white">
          <Check size={48} strokeWidth={3} />
        </span>
        {done.kind === "paid" ? (
          <div className="mt-8">
            <Sentence p={done.payment} />
            <p className="mt-4 text-[15px] text-muted">
              You sent {amountLabel(done.payment.usd / assetOf(done.payment.asset).price, done.payment.asset)}. It&apos;s in{" "}
              {personOf(done.payment.to, people).first}&apos;s wallet now, to keep or sell.
            </p>
            <p className="mt-1 text-[13px] text-muted">Fee {feeLabel(done.payment.feeUsd)} (estimate)</p>
          </div>
        ) : (
          <p className="mt-8 text-[26px] font-medium leading-tight tracking-tight">
            Requested {usd(done.each)} from {recipients.map((h) => personOf(h, people).first).join(", ")}
          </p>
        )}
        <PrimaryButton className="mt-10" onClick={() => router.push("/")}>
          Done
        </PrimaryButton>
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
          <span className="text-[17px] font-semibold">{adding ? "Add someone" : "Pay or request"}</span>
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
          <Link href="/me/code" aria-label="Scan a code" className="flex h-14 w-14 items-center justify-center rounded-full bg-chip">
            <QrCode size={22} />
          </Link>
        </div>
        <p className="px-5 pb-1 pt-6 text-[13px] font-semibold uppercase tracking-wide text-muted">{query || friends.length === 0 ? "People" : "Friends"}</p>
        <ul>
          {candidates.map((p) => (
            <li key={p.handle}>
              <button type="button" onClick={() => choose(p.handle)} className="flex w-full items-center gap-3 px-5 py-3 text-left active:bg-chip">
                <Avatar handle={p.handle} size={48} />
                <span className="flex-1">
                  <span className="block text-[17px] font-semibold">
                    {p.first} {p.last}
                  </span>
                  <span className="block text-[15px] text-muted">@{p.handle}</span>
                </span>
              </button>
            </li>
          ))}
          {candidates.length === 0 && <li className="px-5 py-6 text-muted">Nobody by that name yet.</li>}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex min-h-app flex-col bg-white">
      <div className="flex h-14 items-center justify-between px-3">
        <button type="button" aria-label="Close" onClick={() => router.push("/")} className="flex h-10 w-10 items-center justify-center rounded-full bg-chip">
          <X size={20} />
        </button>
        <button type="button" onClick={() => setAudienceOpen(true)} className="flex h-10 items-center rounded-full bg-chip px-4 text-[15px] font-semibold">
          <AudienceLabel audience={audience} />
        </button>
      </div>

      <div className="flex flex-col items-center px-6 pt-2">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-3">
            {recipients.slice(0, 4).map((h) => (
              <Avatar key={h} handle={h} size={64} ring />
            ))}
          </div>
          <button type="button" aria-label="Add another person" onClick={() => setAdding(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-chip">
            <Plus size={20} />
          </button>
        </div>
        <p className="mt-3 text-[20px] font-semibold">
          {split ? `${recipients.length} people` : first ? `${first.first} ${first.last}` : ""}
        </p>
        <p className="text-[15px] text-muted">{split ? recipients.map((h) => `@${h}`).join("  ") : first ? `@${first.handle}` : ""}</p>

        <div className="mt-5 flex items-start justify-center font-semibold tracking-tight">
          <span className="mt-2 text-[28px]">$</span>
          <span className={`text-[76px] leading-none ${amount ? "text-ink" : "text-line"}`}>{amount || "0"}</span>
        </div>
        {split && value > 0 && <p className="mt-1 text-[15px] text-muted">{usd(each, { cents: true })} each, split with you</p>}

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
              onClick={() => setNote((n) => (n.includes(e) ? n : `${e} ${n}`.trim() + (n ? "" : " ")).slice(0, 140))}
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
            onClick={() => setConfirmOpen(true)}
            className="h-14 flex-1 rounded-full bg-brand text-lg font-semibold text-white disabled:opacity-40"
          >
            Pay
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3">
          {KEYS.map((k) => (
            <button key={k} type="button" onClick={() => press(k)} className="flex h-14 items-center justify-center text-[26px] font-medium active:bg-chip">
              {k === "del" ? <Delete size={26} /> : k}
            </button>
          ))}
        </div>
      </div>

      <Sheet open={audienceOpen} onClose={() => setAudienceOpen(false)} title="Who can see this?">
        <div className="space-y-2">
          {AUDIENCES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setAudience(a.id);
                setAudienceOpen(false);
              }}
              className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left ${audience === a.id ? "bg-brand-soft" : "bg-chip"}`}
            >
              <span className="flex-1">
                <AudienceLabel audience={a.id} className="text-[17px] font-semibold" />
                <span className="mt-0.5 block text-[14px] text-muted">{a.hint}</span>
              </span>
              {audience === a.id && <Check size={20} className="text-brand" />}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title={first ? `Pay ${shortName(first)} ${usd(value)}` : "Pay"}>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">Send from your portfolio</p>
        <div className="space-y-2">
          {funded.map((h) => {
            const enough = h.value >= value;
            const selected = chosen === h.asset.symbol;
            return (
              <button
                key={h.asset.symbol}
                type="button"
                disabled={!enough}
                onClick={() => setPayAsset(h.asset.symbol)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left disabled:opacity-35 ${selected ? "bg-brand-soft ring-1 ring-brand/40" : "bg-chip"}`}
              >
                <AssetDot symbol={h.asset.symbol} size={40} />
                <span className="flex-1">
                  <span className="block text-[16px] font-semibold">{h.asset.name}</span>
                  <span className="block text-[13px] text-muted">
                    {selected && enough ? `You send ${amountLabel(value / h.asset.price, h.asset.symbol)}` : amountLabel(h.units, h.asset.symbol)}
                  </span>
                </span>
                <span className="font-mono text-[15px] font-semibold">{usd(h.value, { cents: true })}</span>
              </button>
            );
          })}
        </div>
        {first && chosen && (
          <div className="mt-4 space-y-2 rounded-2xl border border-line p-4 text-[15px]">
            <div className="flex items-center justify-between">
              <span className="text-muted">{first.first} gets</span>
              <span className="flex items-center gap-2 font-semibold">
                <AssetDot symbol={chosen} size={22} />
                {amountLabel(value / assetOf(chosen).price, chosen)}
              </span>
            </div>
            <p className="text-[13px] text-muted">{first.first} can keep it or sell it for dollars any time.</p>
            <div className="flex items-center justify-between">
              <span className="text-muted">Fee</span>
              <span className="font-semibold">under 1¢ (estimate)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Who can see it</span>
              <AudienceLabel audience={audience} className="font-semibold" />
            </div>
            {firstTime && <p className="rounded-xl bg-brand-soft px-3 py-2 text-[14px] font-medium text-brand">First time paying @{first.handle}. Check the name.</p>}
          </div>
        )}
        <PrimaryButton className="mt-5" disabled={!chosen} onClick={doPay}>
          {chosen ? `Pay ${usd(value)}` : "Not enough in any one holding"}
        </PrimaryButton>
      </Sheet>
    </div>
  );
}
