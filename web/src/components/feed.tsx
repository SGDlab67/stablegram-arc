"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, SmilePlus } from "lucide-react";
import { useState } from "react";
import { REACTION_CHOICES, agoLabel, emojiOf, personOf, shortName, textOf, tileColor, usd, type Payment } from "@/lib/data";
import { useStore } from "@/lib/store";
import { AssetChip, AudienceLabel, Avatar, BlackPill, Card } from "./ui";

export function Sentence({ p, size = "lg" }: { p: Payment; size?: "lg" | "sm" }) {
  const { me, people } = useStore();
  const mine = p.from === me.handle || p.to === me.handle;
  const from = personOf(p.from, people);
  const to = personOf(p.to, people);
  const big = size === "lg";
  const av = big ? 28 : 20;
  const name = (handle: string, label: string, capital: boolean) =>
    handle === me.handle ? (
      <span className="font-semibold text-ink">{capital ? "You" : "you"}</span>
    ) : (
      <span className="font-semibold text-ink">
        <span className="mr-1.5 inline-block align-[-0.18em]">
          <Avatar handle={handle} size={av} />
        </span>
        {label}
      </span>
    );
  return (
    <p className={`${big ? "text-[26px] leading-[1.22]" : "text-[15px] leading-snug"} font-medium tracking-tight text-muted`}>
      {name(p.from, shortName(from), true)} paid {name(p.to, shortName(to), false)}
      {mine && <span className="font-semibold text-ink"> {usd(p.usd)}</span>} for <span className="font-semibold text-ink">{textOf(p.note)}</span>
    </p>
  );
}

export function ReactionRow({ p }: { p: Payment }) {
  const { react, me } = useStore();
  const [picking, setPicking] = useState(false);
  const entries = Object.entries(p.reactions).filter(([, who]) => who.length > 0);
  return (
    <>
      {entries.map(([emoji, who]) => {
        const mine = who.includes(me.handle);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => react(p.ref, emoji)}
            className={`pop inline-flex h-12 items-center gap-1.5 rounded-full px-4 text-[17px] font-semibold ${mine ? "bg-brand-soft text-brand ring-1 ring-brand/40" : "bg-chip text-ink"}`}
          >
            <span>{emoji}</span>
            {who.length}
          </button>
        );
      })}
      <button
        type="button"
        aria-label="Add a reaction"
        onClick={() => setPicking((v) => !v)}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-chip"
      >
        <SmilePlus size={22} />
      </button>
      {picking && (
        <div className="slide-up flex w-full gap-2 pt-1">
          {REACTION_CHOICES.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                react(p.ref, emoji);
                setPicking(false);
              }}
              className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-chip text-2xl active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export function FeedCard({ p, linked = true }: { p: Payment; linked?: boolean }) {
  const { me, react } = useStore();
  const router = useRouter();
  const emoji = emojiOf(p.note);
  const sent = p.from === me.handle;
  const received = p.to === me.handle;
  const other = sent ? p.to : p.from;
  const body = (
    <>
      <div className="mb-3 flex items-center gap-2 text-[14px] text-muted">
        <AudienceLabel audience={p.audience} verbose />
        <span>·</span>
        <span>{agoLabel(p.ago)}</span>
      </div>
      <Sentence p={p} />
      <div className="mt-3">
        <AssetChip symbol={p.asset} />
      </div>
      {emoji && (
        <div className="mt-4 flex h-44 items-center justify-center rounded-[22px] text-[92px] leading-none" style={{ background: tileColor(emoji) }}>
          <span className="drop-shadow-sm">{emoji}</span>
        </div>
      )}
    </>
  );
  return (
    <Card>
      {linked ? (
        <Link href={`/p/${p.ref}`} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {sent && <BlackPill href={`/pay?to=${other}&amount=${p.usd}&note=${encodeURIComponent(p.note)}`}>Pay again</BlackPill>}
        {received && (
          <BlackPill
            onClick={() => {
              if (!p.reactions["🙏"]?.includes(me.handle)) react(p.ref, "🙏");
              router.push(`/p/${p.ref}?thanks=1`);
            }}
          >
            Say thanks
          </BlackPill>
        )}
        <Link href={`/p/${p.ref}`} aria-label="Comments" className="inline-flex h-12 min-w-12 items-center justify-center gap-1.5 rounded-full bg-chip px-3.5 text-[17px] font-semibold">
          <MessageCircle size={22} />
          {p.comments.length > 0 && p.comments.length}
        </Link>
        <ReactionRow p={p} />
      </div>
    </Card>
  );
}

export function ActivityRow({ p }: { p: Payment }) {
  const { me } = useStore();
  const sent = p.from === me.handle;
  const other = sent ? p.to : p.from;
  return (
    <Link href={`/p/${p.ref}`} className="flex items-center gap-3 py-3">
      <Avatar handle={other} size={44} />
      <div className="min-w-0 flex-1">
        <Sentence p={{ ...p }} size="sm" />
        <div className="mt-0.5 text-[13px] text-muted">
          {agoLabel(p.ago)} · {p.asset}
        </div>
      </div>
      <span className={`font-mono text-[15px] font-semibold ${sent ? "text-ink" : "text-money"}`}>
        {sent ? "−" : "+"} {usd(p.usd)}
      </span>
    </Link>
  );
}
