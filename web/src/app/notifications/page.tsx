"use client";

import Link from "next/link";
import { BackHeader, Screen } from "@/components/shell";
import { Avatar, Card, EmptyState, SectionTitle } from "@/components/ui";
import { Bell } from "lucide-react";
import { agoLabel, personOf, shortName } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function NotificationsPage() {
  const { notices, people } = useStore();
  return (
    <Screen tabs={false}>
      <BackHeader title="Notifications" fallback="/me" />
      <div className="px-4 pb-8">
        {notices.length === 0 ? (
          <div className="pt-10">
            <EmptyState icon={Bell} title="No notifications yet" text="Payments, requests and reactions show up here." />
          </div>
        ) : (
          [
            { title: "New", items: notices.filter((x) => x.ago < 60 * 3) },
            { title: "Today", items: notices.filter((x) => x.ago >= 60 * 3 && x.ago < 60 * 24) },
            { title: "Earlier", items: notices.filter((x) => x.ago >= 60 * 24) },
          ]
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <div key={g.title}>
                <SectionTitle>{g.title}</SectionTitle>
                <Card className="divide-y divide-line py-1">
                  {g.items.map((n) => (
                    <Link key={n.id} href={n.href} className="flex items-center gap-3 py-3.5">
                      <span className="relative">
                        <Avatar handle={n.actor} size={44} />
                        {g.title === "New" && <span className="absolute -left-1 top-1 h-2.5 w-2.5 rounded-full bg-[#E5484D] ring-2 ring-white" />}
                      </span>
                      <p className="min-w-0 flex-1 text-[16px] leading-snug text-muted">
                        <span className="font-semibold text-ink">{shortName(personOf(n.actor, people))}</span> {n.text}
                      </p>
                      <span className="text-[13px] text-muted">{agoLabel(n.ago)}</span>
                    </Link>
                  ))}
                </Card>
              </div>
            ))
        )}
      </div>
    </Screen>
  );
}
