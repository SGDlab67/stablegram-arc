"use client";

import Link from "next/link";
import { useState } from "react";
import { FeedCard } from "@/components/feed";
import { InstallHint } from "@/components/install-hint";
import { Screen, SearchBar } from "@/components/shell";
import { AssetDot, Avatar, PreviewNote } from "@/components/ui";
import { personOf } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function Home() {
  const { payments, canSee, friends, me, people, requests, receivePref, incoming } = useStore();
  const [scope, setScope] = useState<"friends" | "everyone">("friends");
  const openRequests = requests.filter((r) => r.payer === me.handle && r.status === "open").length;

  const visible = payments.filter(canSee);
  const feed =
    scope === "everyone"
      ? visible.filter((p) => p.audience === "public")
      : visible.filter((p) => [p.from, p.to].some((h) => h === me.handle || friends.includes(h)));

  const top = friends.slice(0, 6);

  return (
    <Screen>
      <SearchBar />
      <InstallHint />

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
        <Link href="/portfolio?paidin=1" className="flex items-center gap-3 rounded-[22px] bg-white p-4">
          {receivePref ? <AssetDot symbol={receivePref} size={40} /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-chip">↔</span>}
          <span className="text-[15px] font-semibold leading-tight">
            Get paid in
            <br />
            <span className="text-brand">{receivePref ?? "anything"}</span>
          </span>
        </Link>
        {openRequests > 0 ? (
          <Link href="/requests" className="flex items-center gap-3 rounded-[22px] bg-white p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-lg font-bold text-brand">{openRequests}</span>
            <span className="text-[15px] font-semibold leading-tight">
              {openRequests === 1 ? "Request" : "Requests"}
              <br />
              <span className="text-brand">waiting</span>
            </span>
          </Link>
        ) : (
          <Link href="/friends" className="flex items-center gap-3 rounded-[22px] bg-white p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-lg font-bold text-brand">{incoming.length || "+"}</span>
            <span className="text-[15px] font-semibold leading-tight">
              Add
              <br />
              <span className="text-brand">friends</span>
            </span>
          </Link>
        )}
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

      <div className="space-y-3 px-4 pt-3">
        {feed.map((p) => (
          <div key={p.ref} className={p.ago === 0 ? "slide-up" : ""}>
            <FeedCard p={p} />
          </div>
        ))}
        {feed.length === 0 && (
          <div className="rounded-[28px] bg-white p-8 text-center">
            <p className="text-lg font-semibold">Nothing here yet</p>
            <p className="mt-1 text-muted">Add a few friends to see what they are paying for.</p>
            <Link href="/friends" className="mt-4 inline-flex h-11 items-center rounded-full bg-brand px-5 font-semibold text-white">
              Find friends
            </Link>
          </div>
        )}
      </div>
      <PreviewNote />
    </Screen>
  );
}
