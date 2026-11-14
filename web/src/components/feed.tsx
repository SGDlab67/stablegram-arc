"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, SmilePlus } from "lucide-react";
import { useState } from "react";
import { REACTION_CHOICES, agoLabel, personOf, shortName, textOf, usd, type Payment } from "@/lib/data";
import { useStore } from "@/lib/store";
import { AssetChip, AudienceLabel, Avatar, Card } from "./ui";

export function Sentence({ p, size = "lg" }: { p: Payment; size?: "lg" | "md" | "sm" }) {
  const { me, people } = useStore();
  const mine = p.from === me.handle || p.to === me.handle;
  const from = personOf(p.from, people);
  const to = personOf(p.to, people);
  const big = size === "lg";
  const av = big ? 28 : size === "md" ? 22 : 20;
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
    <p className={`${big ? "text-[26px] leading-[1.22]" : size === "md" ? "text-[17px] leading-snug" : "text-[15px] leading-snug"} font-medium tracking-tight text-muted`}>
      {name(p.from, shortName(from), true)} paid {name(p.to, shortName(to), false)}
      {mine && <span className="font-semibold text-ink"> {usd(p.usd)}</span>} for <span className="font-semibold text-ink">{size === "md" ? p.note : textOf(p.note)}</span>
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
            className={`pop inline-flex h-9 items-center gap-1 rounded-full px-3 text-[14px] font-semibold ${mine ? "bg-brand-soft text-brand ring-1 ring-brand/40" : "bg-chip text-ink"}`}
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
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-chip"
      >
        <SmilePlus size={18} />
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
              className="flex h-10 flex-1 items-center justify-center rounded-2xl bg-chip text-xl active:scale-90"
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
  const { me, react, privacyOf } = useStore();
  const router = useRouter();
  const sent = p.from === me.handle;
  const received = p.to === me.handle;
  // Which asset was sent shows to the two people, and to others only if both share their activity.
  const showAsset = sent || received || (privacyOf(p.from).activity && privacyOf(p.to).activity);
  const other = sent ? p.to : p.from;
  const body = (
    <>
      <div className="mb-1.5 flex items-center gap-1.5 text-[12px] text-muted">
        <span>{agoLabel(p.ago)}</span>
        {p.audience === "private" && (
          <>
            <span>·</span>
            <AudienceLabel audience="private" />
          </>
        )}
      </div>
      <Sentence p={p} size="md" />
    </>
  );
  return (
    <Card className="!p-4">
      {linked ? (
        <Link href={`/p/${p.ref}`} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {showAsset && <AssetChip symbol={p.asset} />}
        {sent && (
          <Link href={`/pay?to=${other}&amount=${p.usd}&note=${encodeURIComponent(p.note)}`} className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[14px] font-semibold text-white">
            Pay again
          </Link>
        )}
        {received && (
          <button
            type="button"
            onClick={() => {
              if (!p.reactions["🙏"]?.includes(me.handle)) react(p.ref, "🙏");
              router.push(`/p/${p.ref}?thanks=1`);
            }}
            className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[14px] font-semibold text-white"
          >
            Say thanks
          </button>
        )}
        <Link href={`/p/${p.ref}`} aria-label="Comments" className="inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full bg-chip px-2.5 text-[14px] font-semibold">
          <MessageCircle size={18} />
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
