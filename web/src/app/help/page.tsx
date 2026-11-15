"use client";

import Link from "next/link";
import { ChevronDown, FileText, Lock, Mail, Search } from "lucide-react";
import { useState } from "react";
import { BackHeader, Screen } from "@/components/shell";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { APP_NAME } from "@/lib/data";
import { FAQ, TERMS_VERSION } from "@/lib/legal";

export default function HelpPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const groups = FAQ.map((g) => ({ ...g, items: g.items.filter((i) => !q || i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)) })).filter((g) => g.items.length);

  return (
    <Screen tabs={false}>
      <BackHeader title="Help & FAQ" fallback="/me/settings" />
      <div className="px-4 pb-12">
        <label className="flex h-12 items-center gap-2 rounded-full bg-white px-4">
          <Search size={18} className="text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions" className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted" />
        </label>

        <Card className="mt-4">
          <p className="text-[14px] font-semibold text-muted">Fees at a glance</p>
          <p className="mt-0.5 text-[12px] text-muted">Every fee is shown before you confirm.</p>
          <div className="mt-2 divide-y divide-line text-[15px]">
            {[
              ["Send or receive", "Under 1¢"],
              ["Buy with card, bank or Venmo", "Partner's fee"],
              ["Sell for dollars", "Small spread"],
              ["App fee", "None"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-2.5">
                <span>{k}</span>
                <span className="shrink-0 text-right font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        {groups.map((g) => (
          <div key={g.group}>
            <SectionTitle>{g.group}</SectionTitle>
            <Card className="divide-y divide-line !py-1">
              {g.items.map((item) => {
                const isOpen = open === item.q || !!q;
                return (
                  <div key={item.q}>
                    <button type="button" aria-expanded={isOpen} onClick={() => setOpen(open === item.q ? null : item.q)} className="no-press flex w-full items-center gap-3 py-3.5 text-left">
                      <span className="flex-1 text-[16px] font-semibold">{item.q}</span>
                      <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && <p className="fade-in selectable pb-4 text-[15px] leading-relaxed text-[#3d3a35]">{item.a}</p>}
                  </div>
                );
              })}
            </Card>
          </div>
        ))}
        {groups.length === 0 && <EmptyState icon={Search} title={`No answers for “${query}”`} text="Try another word, or contact us below." />}

        <SectionTitle>More</SectionTitle>
        <Card className="divide-y divide-line !py-1">
          <Link href="/legal/terms" className="flex items-center gap-3 py-3.5 text-[16px] font-semibold">
            <FileText size={19} className="text-brand" /> Terms of Service
          </Link>
          <Link href="/legal/privacy" className="flex items-center gap-3 py-3.5 text-[16px] font-semibold">
            <Lock size={19} className="text-brand" /> Privacy Policy
          </Link>
          <a href={`mailto:hello@${APP_NAME.toLowerCase()}.app`} className="flex items-center gap-3 py-3.5 text-[16px] font-semibold">
            <Mail size={19} className="text-brand" /> Contact us
          </a>
        </Card>
        <p className="pt-4 text-center text-[12px] text-muted">
          {APP_NAME} demo · Terms {TERMS_VERSION}
        </p>
      </div>
    </Screen>
  );
}
