"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { FeedCard } from "@/components/feed";
import { BackHeader, Screen } from "@/components/shell";
import { AudienceLabel, Avatar, Card, PrimaryButton, SectionTitle, Sheet } from "@/components/ui";
import { agoLabel, amountLabel, assetOf, feeLabel, personOf, shortName, usd } from "@/lib/data";
import { useStore } from "@/lib/store";

const THANKS = ["Thanks! 🙏", "You're the best", "Got it 👍"];

export function PaymentScreen() {
  const { ref: payRef } = useParams<{ ref: string }>();
  const thanks = useSearchParams().get("thanks") === "1";
  const { payments, canSee, me, people, comment, holdings, sell } = useStore();
  const [text, setText] = useState("");
  const [selling, setSelling] = useState(false);
  const [sold, setSold] = useState(false);
  const p = payments.find((x) => x.ref === payRef);

  if (!p || !canSee(p)) {
    return (
      <Screen tabs={false}>
        <BackHeader title="Payment" />
        <p className="p-8 text-center text-muted">This payment isn&apos;t visible to you.</p>
      </Screen>
    );
  }

  const mine = p.from === me.handle || p.to === me.handle;
  const asset = assetOf(p.asset);
  const units = p.usd / asset.price;
  // What selling this payment would bring in now, capped at what is still held.
  const sellable = Math.min(units, holdings[p.asset] ?? 0) * asset.price;
  const canSell = p.to === me.handle && p.asset !== "USDC" && sellable >= 0.01;
  const send = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    comment(p.ref, clean);
    setText("");
  };
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between gap-4 py-3 text-[16px]">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );

  return (
    <Screen tabs={false}>
      <BackHeader title="Payment" />
      <div className="px-4 pt-2">
        <FeedCard p={p} linked={false} />

        {mine && (
          <>
            <SectionTitle>Details</SectionTitle>
            <Card className="divide-y divide-line py-1">
              {row("Amount", usd(p.usd, { cents: true }))}
              {row(p.from === me.handle ? "You sent" : `${personOf(p.from, people).first} sent`, amountLabel(units, p.asset))}
              {row("Fee", feeLabel(p.feeUsd))}
              {row("Who can see", <AudienceLabel audience={p.audience} />)}
            </Card>
            {(canSell || sold) && (
              <PrimaryButton className="mt-3" disabled={sold} onClick={() => setSelling(true)}>
                {sold ? "Sold for dollars" : `Sell for dollars, about ${usd(sellable, { cents: true })}`}
              </PrimaryButton>
            )}
            <p className="px-2 pt-2 text-[13px] leading-relaxed text-muted">
              Only the two of you see the amount here. The transfer itself is on a public blockchain.
            </p>
          </>
        )}

        <SectionTitle>Comments</SectionTitle>
        {p.comments.length === 0 ? (
          <p className="px-2 py-4 text-muted">No comments yet.</p>
        ) : (
          <Card className="space-y-4">
            {p.comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <Avatar handle={c.by} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-muted">
                    <span className="font-semibold text-ink">{c.by === me.handle ? "You" : shortName(personOf(c.by, people))}</span> · {agoLabel(c.ago)}
                  </p>
                  <p className="selectable text-[16px] leading-snug">{c.text}</p>
                </div>
              </div>
            ))}
          </Card>
        )}
        <div className="h-36" />
      </div>

      <Sheet open={selling} onClose={() => setSelling(false)} title={`Sell ${asset.name}?`}>
        <p className="-mt-2 text-[15px] leading-relaxed text-muted">
          You get about {usd(sellable, { cents: true })} in dollars for {amountLabel(sellable / asset.price, p.asset)}. Or keep it: it stays in your portfolio.
        </p>
        <PrimaryButton
          className="mt-5"
          onClick={() => {
            sell(p.asset, sellable);
            setSold(true);
            setSelling(false);
          }}
        >
          Sell for {usd(sellable, { cents: true })}
        </PrimaryButton>
        <button type="button" onClick={() => setSelling(false)} className="mt-2 h-12 w-full text-[16px] font-semibold text-brand">
          Keep it
        </button>
      </Sheet>

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-white px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
        {thanks && p.comments.every((c) => c.by !== me.handle) && (
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
            {THANKS.map((t) => (
              <button key={t} type="button" onClick={() => send(t)} className="h-9 shrink-0 rounded-full bg-chip px-4 text-[14px] font-semibold">
                {t}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={thanks ? "Say thanks…" : "Add a comment"}
            maxLength={200}
            className="h-12 flex-1 rounded-full bg-chip px-5 text-[16px] outline-none placeholder:text-muted"
          />
          <button type="submit" aria-label="Send" disabled={!text.trim()} className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40">
            <ArrowUp size={22} />
          </button>
        </form>
      </div>
    </Screen>
  );
}
