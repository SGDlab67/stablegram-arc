"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { FeedCard } from "@/components/feed";
import { InstallHint } from "@/components/install-hint";
import { Mark, Screen, SearchBar } from "@/components/shell";
import { AssetDot, Avatar, EmptyState, PreviewNote } from "@/components/ui";
import { UsersRound } from "lucide-react";
import { Bot, ChevronRight, Plus } from "lucide-react";
import { ASSETS, HACKATHON_TAG, personOf, usd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useCountUp } from "@/components/feel";

const noSubscribe = () => () => {};
function greetingNow() {
  const h = new Date().getHours();
  return h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
/** Time-of-day greeting. Read on the phone only; the prepared page says "Hi". */
function useGreeting() {
  return useSyncExternalStore(noSubscribe, greetingNow, () => "Hi");
}

export default function Home() {
  const { payments, canSee, friends, me, people, requests, incoming, totalUsd, hideBalances, holdings, friendState, addFriend, acceptFriend } = useStore();
  // Hackathon people you aren't friends with yet first, so the row always has someone to add.
  const hackers = people
    .filter((p) => p.tag === HACKATHON_TAG && p.handle !== me.handle)
    .sort((a, b) => Number(friends.includes(a.handle)) - Number(friends.includes(b.handle)));
  const [scope, setScope] = useState<"friends" | "everyone">("friends");
  const openRequests = requests.filter((r) => r.payer === me.handle && r.status === "open").length;

  const visible = payments.filter(canSee);
  const feed =
    scope === "everyone"
      ? visible.filter((p) => p.audience === "public")
      : visible.filter((p) => [p.from, p.to].some((h) => h === me.handle || friends.includes(h)));

  const top = friends.slice(0, 6);
  const stableUsd = ASSETS.filter((a) => a.group === "cash").reduce((sum, a) => sum + (holdings[a.symbol] ?? 0) * a.price, 0);
  // Home splits the total: investments on the left, stablecoins on the right, so nothing is counted twice.
  const counted = useCountUp(totalUsd - stableUsd);
  const greet = useGreeting();

  return (
    <Screen>
      <SearchBar />
      <InstallHint />
      <p className="px-5 pb-2 text-[22px] font-semibold tracking-tight">
        {greet}, {me.first}
      </p>

      {/* The agent dashboard is the point of the project, and nothing used to link to it. */}
      <Link href="/dashboard" className="mx-4 flex items-center gap-3 rounded-[22px] bg-brand p-4 text-white">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Bot size={20} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">Owner dashboard</span>
          <span className="block text-[13px] text-white/85">The forecast, the agent budget and what needs your approval</span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-white/85" aria-hidden />
      </Link>

      <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-1 pt-1">
        {top.map((h) => (
          <Link key={h} href={`/pay?to=${h}`} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <Avatar handle={h} size={60} />
            <span className="w-full truncate text-center text-[13px] font-medium">{personOf(h, people).first}</span>
          </Link>
        ))}
        <Link href="/friends" className="flex w-16 shrink-0 flex-col items-center gap-1.5">
          <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white text-2xl text-brand">+</span>
          <span className="text-[13px] font-medium text-brand">Add</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        <Link href="/portfolio" className="rounded-[22px] bg-white p-4">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
            <Mark size={15} className="text-brand" /> Portfolio
          </span>
          <span className="tabular mt-1 block text-[22px] font-semibold tracking-tight">{hideBalances ? "$•••••" : usd(counted)}</span>
          <span className="mt-0.5 block text-[12px] text-muted">Stocks, crypto & more</span>
        </Link>
        <div className="flex flex-col rounded-[22px] bg-white p-4">
          <Link href="/deposit" className="block">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
              <span className="flex -space-x-1.5">
                {["USDC", "USDT", "PYUSD"].map((s) => (
                  <span key={s} className="rounded-full ring-2 ring-white">
                    <AssetDot symbol={s} size={15} />
                  </span>
                ))}
              </span>
              Stablecoins
            </span>
            <span className="tabular mt-1 block text-[22px] font-semibold tracking-tight">{hideBalances ? "$•••••" : usd(stableUsd)}</span>
          </Link>
          <Link href="/deposit" className="mt-1.5 inline-flex h-7 w-fit items-center gap-1 rounded-full bg-brand px-2.5 text-[12px] font-semibold text-white">
            <Plus size={13} strokeWidth={2.8} /> Add money
          </Link>
        </div>
      </div>
      {(openRequests > 0 || incoming.length > 0) && (
        <Link href={openRequests > 0 ? "/requests" : "/friends"} className="mx-4 mt-3 flex items-center gap-3 rounded-[22px] bg-white px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-[14px] font-bold text-brand">{openRequests || incoming.length}</span>
          <span className="flex-1 text-[15px] font-semibold">
            {openRequests > 0 ? `${openRequests === 1 ? "Request" : "Requests"} waiting for you` : `${incoming.length === 1 ? "Friend request" : "Friend requests"} waiting`}
          </span>
          <ChevronRight size={18} className="text-muted" />
        </Link>
      )}

      <div className="pt-5">
        <div className="flex items-center justify-between px-5 pb-2">
          <p className="text-[15px] font-semibold">At {HACKATHON_TAG}</p>
          <Link href="/friends#ubc" className="hit text-[14px] font-semibold text-brand">
            See all {hackers.length}
          </Link>
        </div>
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-1">
          {hackers.slice(0, 14).map((p) => {
            const state = friendState(p.handle);
            return (
              <div key={p.handle} className="flex w-[112px] shrink-0 flex-col items-center rounded-[20px] bg-white px-2 pb-2.5 pt-3">
                <Link href={`/u/${p.handle}`} className="flex flex-col items-center">
                  <Avatar handle={p.handle} size={52} />
                  <span className="mt-1.5 w-full truncate text-center text-[14px] font-semibold">{p.first}</span>
                  <span className="w-full truncate text-center text-[12px] text-muted">{p.last}</span>
                </Link>
                {state === "friends" ? (
                  <span className="mt-2 h-7 text-[12px] font-semibold leading-7 text-muted">Friends</span>
                ) : state === "requested" ? (
                  <span className="mt-2 h-7 rounded-full bg-chip px-3 text-[12px] font-semibold leading-7 text-muted">Requested</span>
                ) : state === "incoming" ? (
                  <button type="button" onClick={() => acceptFriend(p.handle)} className="mt-2 h-7 rounded-full bg-brand px-3 text-[12px] font-semibold text-white">
                    Accept
                  </button>
                ) : (
                  <button type="button" onClick={() => addFriend(p.handle)} className="mt-2 h-7 rounded-full bg-brand px-3.5 text-[12px] font-semibold text-white">
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-4 mt-5 flex rounded-full bg-white p-1 text-[15px] font-semibold">
        {(["friends", "everyone"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`h-10 flex-1 rounded-full capitalize transition ${scope === s ? "bg-ink text-white" : "text-muted"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-2.5 px-4 pt-3">
        {feed.map((p) => (
          <div key={p.ref} className={p.ago === 0 ? "slide-up" : ""}>
            <FeedCard p={p} />
          </div>
        ))}
        {feed.length === 0 && (
          <div className="rounded-[28px] bg-white">
            <EmptyState icon={UsersRound} title="Nothing here yet" text="Add a few friends to see what they are paying for." action={{ label: "Find friends", href: "/friends" }} />
          </div>
        )}
      </div>
      <PreviewNote />
    </Screen>
  );
}
