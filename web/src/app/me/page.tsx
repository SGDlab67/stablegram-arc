"use client";

import Link from "next/link";
import { Bell, QrCode, Settings, Share } from "lucide-react";
import { ActivityRow } from "@/components/feed";
import { RequestCards } from "@/components/requests";
import { Screen } from "@/components/shell";
import { Avatar, Card, PreviewNote, SectionTitle } from "@/components/ui";
import { usd } from "@/lib/data";
import { toast } from "@/components/feel";
import { useStore } from "@/lib/store";

export default function Me() {
  const { me, friends, totalUsd, payments, notices, hideBalances, myPrivacy } = useStore();
  const share = async () => {
    const url = `${window.location.origin}/u/${me.handle}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `@${me.handle}`, url });
        return;
      } catch {
        // fall through to copy
      }
    }
    await navigator.clipboard?.writeText(url);
    toast("Profile link copied");
  };
  const mine = payments.filter((p) => p.from === me.handle || p.to === me.handle);
  return (
    <Screen>
      <div className="flex items-center justify-end gap-2 px-4 pt-4">
        <Link href="/notifications" aria-label="Notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white">
          <Bell size={20} />
          {notices.length > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#E5484D] ring-2 ring-white" />}
        </Link>
        <Link href="/me/settings" aria-label="Settings" className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
          <Settings size={20} />
        </Link>
      </div>

      <div className="flex flex-col items-center px-6 pt-2">
        <Link href="/me/code" className="relative">
          <Avatar handle={me.handle} size={104} />
          <span className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white ring-4 ring-page">
            <QrCode size={18} />
          </span>
        </Link>
        <h1 className="mt-4 text-[26px] font-semibold tracking-tight">
          {me.first} {me.last}
        </h1>
        <p className="text-[16px] text-muted">@{me.handle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pt-5">
        <Link href="/friends" className="rounded-[22px] bg-white p-4">
          <p className="text-[14px] font-medium text-muted">Friends</p>
          <p className="mt-1 text-[24px] font-semibold">{friends.length}</p>
        </Link>
        <Link href="/portfolio" className="rounded-[22px] bg-white p-4">
          <p className="text-[14px] font-medium text-muted">Portfolio</p>
          <p className="tabular mt-1 text-[24px] font-semibold tracking-tight">{hideBalances ? "$•••••" : usd(totalUsd, { cents: true })}</p>
        </Link>
      </div>

      <div className="px-4 pt-3">
        <div className="flex items-center gap-3 rounded-[22px] bg-white p-4">
          <span className="flex-1">
            <span className="block text-[15px] font-semibold">Your profile</span>
            <span className="block text-[13px] text-muted">
              {!myPrivacy.show ? "Portfolio hidden" : `Portfolio visible to ${myPrivacy.who === "everyone" ? "everyone" : "friends"}`}
              {" · "}
              <Link href="/me/settings#portfolio" className="font-semibold text-brand">
                Edit
              </Link>
            </span>
          </span>
          <Link href={`/u/${me.handle}`} className="rounded-full bg-chip px-3.5 py-2 text-[14px] font-semibold">
            View
          </Link>
          <button type="button" onClick={share} className="flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-[14px] font-semibold text-white">
            <Share size={15} /> Share
          </button>
        </div>
      </div>

      <div className="px-4">
        <SectionTitle>Requests</SectionTitle>
        <RequestCards empty />

        <SectionTitle>Your activity</SectionTitle>
        <Card className="divide-y divide-line py-1">
          {mine.map((p) => (
            <ActivityRow key={p.ref} p={p} />
          ))}
          {mine.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-[16px] font-semibold">No payments yet</p>
              <p className="mt-1 text-[14px] text-muted">Pay a friend a slice of your portfolio and it shows up here.</p>
              <Link href="/pay" className="mt-3 inline-flex h-10 items-center rounded-full bg-brand px-4 text-[15px] font-semibold text-white">
                Make your first payment
              </Link>
            </div>
          )}
        </Card>
      </div>
      <PreviewNote />
    </Screen>
  );
}
