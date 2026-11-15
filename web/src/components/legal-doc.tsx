"use client";

import { BackHeader, Screen } from "./shell";
import { Card } from "./ui";
import { LEGAL_UPDATED, type LegalSection } from "@/lib/legal";

/** A long legal page: title, a short summary card, a jump list, then the sections. */
export function LegalDoc({ title, summary, sections }: { title: string; summary: string[]; sections: LegalSection[] }) {
  return (
    <Screen tabs={false}>
      <BackHeader title={title} fallback="/me/settings" />
      <div className="px-4 pb-12">
        <p className="px-1 text-[13px] text-muted">Last updated {LEGAL_UPDATED} · Draft for the demo, not yet reviewed by a lawyer</p>
        <Card className="mt-3 bg-brand-soft">
          <p className="text-[14px] font-semibold text-brand">The short version</p>
          <ul className="mt-2 space-y-1.5">
            {summary.map((s) => (
              <li key={s} className="flex gap-2 text-[14px] leading-snug text-ink">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {s}
              </li>
            ))}
          </ul>
        </Card>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="h-8 shrink-0 rounded-full bg-white px-3 text-[13px] font-semibold leading-8">
              {s.title.replace(/^\d+\.\s*/, "")}
            </a>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {sections.map((s) => (
            <Card key={s.id} className="scroll-mt-16">
              <h2 id={s.id} className="scroll-mt-20 text-[17px] font-semibold">
                {s.title}
              </h2>
              <div className="selectable mt-2 space-y-2.5">
                {s.body.map((p) => (
                  <p key={p} className="text-[15px] leading-relaxed text-[#3d3a35]">
                    {p}
                  </p>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Screen>
  );
}
