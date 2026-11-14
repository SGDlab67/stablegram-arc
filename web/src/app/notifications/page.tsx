"use client";

import Link from "next/link";
import { BackHeader, Screen } from "@/components/shell";
import { Avatar, Card } from "@/components/ui";
import { agoLabel, personOf, shortName } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function NotificationsPage() {
  const { notices, people } = useStore();
  return (
    <Screen tabs={false}>
      <BackHeader title="Notifications" fallback="/me" />
      <div className="px-4 pt-2">
        {notices.length === 0 ? (
          <p className="px-2 py-16 text-center text-muted">Nothing yet. Payments, requests and reactions show up here.</p>
        ) : (
          <Card className="divide-y divide-line py-1">
            {notices.map((n) => (
              <Link key={n.id} href={n.href} className="flex items-center gap-3 py-3.5">
                <Avatar handle={n.actor} size={44} />
                <p className="min-w-0 flex-1 text-[16px] leading-snug text-muted">
                  <span className="font-semibold text-ink">{shortName(personOf(n.actor, people))}</span> {n.text}
                </p>
                <span className="text-[13px] text-muted">{agoLabel(n.ago)}</span>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </Screen>
  );
}
