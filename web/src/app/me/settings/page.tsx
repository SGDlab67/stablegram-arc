"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { BackHeader, Screen } from "@/components/shell";
import { AudienceLabel, Avatar, Card, SectionTitle } from "@/components/ui";
import { type Audience } from "@/lib/data";
import { useStore } from "@/lib/store";

const AUDIENCES: { id: Audience; hint: string }[] = [
  { id: "public", hint: "Anyone can see your payments in feeds. Amounts stay hidden." },
  { id: "friends", hint: "Your friends, and the other person's friends." },
  { id: "private", hint: "Only you and the other person." },
];

export default function SettingsPage() {
  const { me, updateMe, defaultAudience, setDefaultAudience } = useStore();
  return (
    <Screen tabs={false}>
      <BackHeader title="Settings" fallback="/me" />
      <div className="px-4">
        <SectionTitle>Profile</SectionTitle>
        <Card>
          <div className="flex items-center gap-4">
            <Avatar handle={me.handle} size={64} />
            <button type="button" className="rounded-full bg-chip px-4 py-2 text-[15px] font-semibold">
              Change photo
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[13px] font-medium text-muted">First name</span>
              <input value={me.first} onChange={(e) => updateMe({ first: e.target.value })} className="mt-1 h-12 w-full rounded-xl border border-line px-3 text-[16px] outline-none focus:border-brand" />
            </label>
            <label className="block">
              <span className="text-[13px] font-medium text-muted">Last name</span>
              <input value={me.last} onChange={(e) => updateMe({ last: e.target.value })} className="mt-1 h-12 w-full rounded-xl border border-line px-3 text-[16px] outline-none focus:border-brand" />
            </label>
          </div>
          <p className="mt-3 text-[15px] text-muted">Username: @{me.handle}</p>
        </Card>

        <SectionTitle>Who sees your future payments</SectionTitle>
        <Card className="space-y-2">
          {AUDIENCES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setDefaultAudience(a.id)}
              className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left ${defaultAudience === a.id ? "bg-brand-soft" : "bg-chip"}`}
            >
              <span className="flex-1">
                <AudienceLabel audience={a.id} className="text-[17px] font-semibold" />
                <span className="mt-0.5 block text-[14px] text-muted">{a.hint}</span>
              </span>
              {defaultAudience === a.id && <Check size={20} className="text-brand" />}
            </button>
          ))}
          <p className="px-1 pt-1 text-[13px] leading-relaxed text-muted">
            Your username is linked to a public wallet. Anyone can see its balances and payments on the blockchain. These settings control
            what shows in feeds.
          </p>
        </Card>

        <SectionTitle>Money</SectionTitle>
        <Card className="divide-y divide-line py-1">
          <div className="flex items-center justify-between py-3 text-[16px]">
            <span className="font-semibold">Wallet</span>
            <span className="font-mono text-[14px] text-muted">0x71C4…9A3f (sample)</span>
          </div>
          <div className="flex items-center justify-between py-3 text-[16px]">
            <span className="font-semibold">Back up this wallet</span>
            <ChevronRight size={18} className="text-muted" />
          </div>
        </Card>

        <Link href="/welcome" className="mt-6 flex h-12 items-center justify-center rounded-full bg-white text-[16px] font-semibold text-down">
          Sign out
        </Link>
      </div>
    </Screen>
  );
}
