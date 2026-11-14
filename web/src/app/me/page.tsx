"use client";

import Link from "next/link";
import { Bell, QrCode, Settings } from "lucide-react";
import { ActivityRow } from "@/components/feed";
import { RequestCards } from "@/components/requests";
import { Screen } from "@/components/shell";
import { Avatar, Card, PreviewNote, SectionTitle } from "@/components/ui";
import { usd } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function Me() {
  const { me, friends, totalUsd, payments, notices } = useStore();
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
          <p className="mt-1 font-mono text-[24px] font-semibold">{usd(totalUsd, { cents: true })}</p>
        </Link>
      </div>

      <div className="px-4">
        <SectionTitle>Requests</SectionTitle>
        <RequestCards empty />

        <SectionTitle>Your activity</SectionTitle>
        <Card className="divide-y divide-line py-1">
          {mine.map((p) => (
            <ActivityRow key={p.ref} p={p} />
          ))}
        </Card>
      </div>
      <PreviewNote />
    </Screen>
  );
}
