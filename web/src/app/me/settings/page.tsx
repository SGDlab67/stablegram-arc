"use client";

import Link from "next/link";
import { Camera, Check, ChevronRight } from "lucide-react";
import { BackHeader, Screen } from "@/components/shell";
import { AudienceLabel, Avatar, Card, SectionTitle } from "@/components/ui";
import { type Audience, type PortfolioPrivacy } from "@/lib/data";
import { PhotoPicker } from "@/components/photo-picker";
import { useStore } from "@/lib/store";

const AUDIENCES: { id: Audience; hint: string }[] = [
  { id: "public", hint: "Anyone can see your payments in feeds. Amounts stay hidden." },
  { id: "private", hint: "Only you and the other person." },
];

function Toggle({ on, onChange, label, hint, disabled = false }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-40"
    >
      <span className="flex-1">
        <span className="block text-[16px] font-semibold">{label}</span>
        {hint && <span className="block text-[13px] leading-snug text-muted">{hint}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-brand" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function Segments<T extends string>({ value, options, onChange, disabled = false }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className={`grid rounded-full bg-chip p-1 ${disabled ? "opacity-40" : ""}`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={disabled}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-9 rounded-full text-[14px] font-semibold ${value === o.id ? "bg-white text-ink shadow-sm" : "text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const AMOUNT_OPTIONS: { id: PortfolioPrivacy["amounts"]; label: string }[] = [
  { id: "dollars", label: "Dollars" },
  { id: "percent", label: "Percent" },
  { id: "hidden", label: "Hide" },
];

export default function SettingsPage() {
  const { me, updateMe, defaultAudience, setDefaultAudience, myPrivacy, setMyPrivacy } = useStore();
  const pv = myPrivacy;
  return (
    <Screen tabs={false}>
      <BackHeader title="Settings" fallback="/me" />
      <div className="px-4">
        <SectionTitle>Profile</SectionTitle>
        <Card>
          <div className="flex items-center gap-4">
            <PhotoPicker hasPhoto={!!me.photo} onChange={(photo) => updateMe({ photo })}>
              {(open) => (
                <>
                  <button type="button" onClick={open} aria-label="Change photo" className="relative">
                    <Avatar handle={me.handle} size={72} />
                    <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white ring-[3px] ring-white">
                      <Camera size={15} />
                    </span>
                  </button>
                  <button type="button" onClick={open} className="rounded-full bg-chip px-4 py-2 text-[15px] font-semibold">
                    {me.photo ? "Change photo" : "Add a photo"}
                  </button>
                </>
              )}
            </PhotoPicker>
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

        <div id="portfolio" className="scroll-mt-16" />
        <SectionTitle
          right={
            <Link href={`/u/${me.handle}`} className="text-[14px] font-semibold text-brand">
              Preview
            </Link>
          }
        >
          Your portfolio on your profile
        </SectionTitle>
        <Card className="!py-2">
          <Toggle on={pv.show} onChange={(v) => setMyPrivacy({ show: v })} label="Show my portfolio" hint="People who open your profile see the parts you turn on below." />
          <div className={`divide-y divide-line border-t border-line ${pv.show ? "" : "pointer-events-none opacity-40"}`}>
            <div className="py-3">
              <p className="mb-2 text-[16px] font-semibold">Who can see it</p>
              <Segments
                value={pv.who}
                onChange={(v) => setMyPrivacy({ who: v })}
                options={[
                  { id: "everyone", label: "Everyone" },
                  { id: "friends", label: "Friends only" },
                ]}
              />
            </div>
            <Toggle on={pv.total} onChange={(v) => setMyPrivacy({ total: v })} label="Total value" hint="The dollar total of everything you hold." />
            <Toggle on={pv.holdings} onChange={(v) => setMyPrivacy({ holdings: v })} label="What I hold" hint="Which stocks, coins and other assets are in your wallet." />
            <div className={`py-3 ${pv.holdings ? "" : "pointer-events-none opacity-40"}`}>
              <p className="text-[16px] font-semibold">How much of each</p>
              <p className="mb-2 text-[13px] text-muted">Dollar value, share of your portfolio, or names only.</p>
              <Segments value={pv.amounts} onChange={(v) => setMyPrivacy({ amounts: v })} options={AMOUNT_OPTIONS} disabled={!pv.holdings} />
            </div>
            <Toggle on={pv.performance} onChange={(v) => setMyPrivacy({ performance: v })} label="Gains and losses" hint="How your portfolio and each holding moved today." />
            <Toggle on={pv.activity} onChange={(v) => setMyPrivacy({ activity: v })} label="What I send and receive" hint="Which stock or coin your public payments were sent in." />
          </div>
        </Card>
        <p className="px-3 pt-2 text-[12px] leading-snug text-muted">
          These choices control what the app shows. Your wallet is on a public blockchain, so someone who knows its address can still look it up.
        </p>

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
          <div className="py-3">
            <p className="text-[16px] font-semibold">Your wallet, your money</p>
            <p className="text-[13px] leading-snug text-muted">Self-custody: only you can move these funds. Not even we can. Payments settle on-chain in seconds.</p>
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
