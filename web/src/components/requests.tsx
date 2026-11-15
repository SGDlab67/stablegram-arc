"use client";

import Link from "next/link";
import { agoLabel, personOf, shortName, textOf, usd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar, Card, EmptyState, GhostButton } from "./ui";
import { Inbox } from "lucide-react";

export function RequestCards({ empty = false }: { empty?: boolean }) {
  const { requests, me, people, declineRequest, cancelRequest } = useStore();
  const incoming = requests.filter((r) => r.payer === me.handle && r.status === "open");
  const outgoing = requests.filter((r) => r.requester === me.handle && r.status === "open");
  if (incoming.length + outgoing.length === 0) {
    return empty ? (
      <Card className="!p-0">
        <EmptyState icon={Inbox} title="No requests waiting" text="When someone asks you for money, it shows up here." />
      </Card>
    ) : null;
  }
  return (
    <div className="space-y-3">
      {incoming.map((r) => {
        const who = personOf(r.requester, people);
        return (
          <Card key={r.id}>
            <div className="flex items-start gap-3">
              <Avatar handle={r.requester} size={44} />
              <div className="flex-1">
                <p className="text-[17px] leading-snug text-muted">
                  <span className="font-semibold text-ink">{shortName(who)}</span> requests{" "}
                  <span className="font-semibold text-ink">{usd(r.usd)}</span> for <span className="font-semibold text-ink">{textOf(r.note)}</span>
                </p>
                <p className="mt-0.5 text-[13px] text-muted">{agoLabel(r.ago)}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/pay?to=${r.requester}&amount=${r.usd}&note=${encodeURIComponent(r.note)}&request=${r.id}`}
                className="flex h-11 flex-1 items-center justify-center rounded-full bg-brand text-[16px] font-semibold text-white"
              >
                Pay
              </Link>
              <GhostButton onClick={() => declineRequest(r.id)} className="h-11 flex-1">
                Decline
              </GhostButton>
            </div>
          </Card>
        );
      })}
      {outgoing.map((r) => {
        const who = personOf(r.payer, people);
        return (
          <Card key={r.id}>
            <div className="flex items-start gap-3">
              <Avatar handle={r.payer} size={44} />
              <div className="flex-1">
                <p className="text-[17px] leading-snug text-muted">
                  You requested <span className="font-semibold text-ink">{usd(r.usd)}</span> from{" "}
                  <span className="font-semibold text-ink">{shortName(who)}</span> for <span className="font-semibold text-ink">{textOf(r.note)}</span>
                </p>
                <p className="mt-0.5 text-[13px] text-muted">{agoLabel(r.ago)} · waiting</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <GhostButton className="h-11 flex-1">Remind</GhostButton>
              <GhostButton onClick={() => cancelRequest(r.id)} className="h-11 flex-1">
                Cancel
              </GhostButton>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
