"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";
import { Screen } from "@/components/shell";
import { Avatar, Card, GhostButton, PreviewNote, SectionTitle } from "@/components/ui";
import { type Person } from "@/lib/data";
import { useStore } from "@/lib/store";

function PersonRow({ p, right }: { p: Person; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/u/${p.handle}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar handle={p.handle} size={48} />
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-semibold">
            {p.first} {p.last}
          </span>
          <span className="block text-[14px] text-muted">@{p.handle}</span>
        </span>
      </Link>
      {right}
    </div>
  );
}

export default function Friends() {
  const { people, me, friends, incoming, outgoing, addFriend, acceptFriend, ignoreFriend, payments } = useStore();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase().replace(/^@/, "");

  const others = people.filter((p) => p.handle !== me.handle);
  const byHandle = (h: string) => others.find((p) => p.handle === h);
  const paidWith = new Set(payments.filter((p) => p.from === me.handle || p.to === me.handle).flatMap((p) => [p.from, p.to]));
  const suggested = others
    .filter((p) => !friends.includes(p.handle) && !incoming.includes(p.handle))
    .sort((a, b) => Number(paidWith.has(b.handle)) - Number(paidWith.has(a.handle)));
  const results = q ? others.filter((p) => p.handle.includes(q) || `${p.first} ${p.last}`.toLowerCase().includes(q)) : [];

  const addButton = (h: string) =>
    friends.includes(h) ? (
      <span className="text-[14px] font-semibold text-muted">Friends</span>
    ) : outgoing.includes(h) ? (
      <span className="rounded-full bg-chip px-4 py-2 text-[14px] font-semibold text-muted">Requested</span>
    ) : (
      <button type="button" onClick={() => addFriend(h)} className="rounded-full bg-brand px-5 py-2 text-[15px] font-semibold text-white">
        Add
      </button>
    );

  return (
    <Screen>
      <div className="px-4 pt-6">
        <h1 className="px-1 text-[30px] font-semibold tracking-tight">Friends</h1>
        <label className="mt-4 flex h-14 items-center gap-3 rounded-full bg-white px-5 shadow-sm">
          <Search size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find people"
            className="w-full bg-transparent text-[17px] outline-none placeholder:text-muted"
          />
        </label>

        {q ? (
          <>
            <SectionTitle>People</SectionTitle>
            <Card className="divide-y divide-line py-1">
              {results.map((p) => (
                <PersonRow key={p.handle} p={p} right={addButton(p.handle)} />
              ))}
              {results.length === 0 && <p className="py-4 text-muted">Nobody by that name yet.</p>}
            </Card>
          </>
        ) : (
          <>
            {incoming.length > 0 && (
              <>
                <SectionTitle>Requests</SectionTitle>
                <Card className="divide-y divide-line py-1">
                  {incoming.map((h) => {
                    const p = byHandle(h);
                    if (!p) return null;
                    return (
                      <PersonRow
                        key={h}
                        p={p}
                        right={
                          <span className="flex gap-2">
                            <button type="button" onClick={() => acceptFriend(h)} className="rounded-full bg-brand px-4 py-2 text-[15px] font-semibold text-white">
                              Accept
                            </button>
                            <GhostButton onClick={() => ignoreFriend(h)}>Ignore</GhostButton>
                          </span>
                        }
                      />
                    );
                  })}
                </Card>
              </>
            )}

            <SectionTitle>Suggested</SectionTitle>
            <Card className="divide-y divide-line py-1">
              {suggested.map((p) => (
                <PersonRow key={p.handle} p={p} right={addButton(p.handle)} />
              ))}
            </Card>

            <SectionTitle right={<span className="text-[13px] font-semibold text-muted">{friends.length}</span>}>Your friends</SectionTitle>
            <Card className="divide-y divide-line py-1">
              {friends
                .map(byHandle)
                .filter((p): p is Person => Boolean(p))
                .sort((a, b) => a.first.localeCompare(b.first))
                .map((p) => (
                  <PersonRow
                    key={p.handle}
                    p={p}
                    right={
                      <Link href={`/pay?to=${p.handle}`} className="rounded-full bg-chip px-4 py-2 text-[15px] font-semibold">
                        Pay
                      </Link>
                    }
                  />
                ))}
              {friends.length === 0 && <p className="py-4 text-muted">No friends yet. Add a few above.</p>}
            </Card>
          </>
        )}
      </div>
      <PreviewNote />
    </Screen>
  );
}
