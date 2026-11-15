"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Clock, UserPlus } from "lucide-react";
import { useState } from "react";
import { ActivityRow, FeedCard } from "@/components/feed";
import { BackHeader, Screen } from "@/components/shell";
import { Avatar, Card, Flag, GhostButton, PrimaryButton, SectionTitle, Sheet } from "@/components/ui";
import { PublicPortfolio } from "@/components/public-portfolio";
import { useStore } from "@/lib/store";
import { countryName } from "@/lib/countries";

export function ProfileScreen() {
  const params = useParams<{ handle: string }>();
  const handle = (params.handle ?? "").toLowerCase();
  const { people, me, friends, payments, canSee, friendState, areFriends, addFriend, acceptFriend, unfriend, privacyOf, holdingsOf } = useStore();
  const [removing, setRemoving] = useState(false);
  const person = people.find((p) => p.handle === handle);

  if (!person) {
    return (
      <Screen tabs={false}>
        <BackHeader title="" />
        <p className="p-8 text-center text-muted">Nobody has the username @{handle} yet.</p>
      </Screen>
    );
  }

  const state = friendState(handle);
  const mutual = friends.filter((f) => f !== handle && areFriends(f, handle)).length;
  const between = payments.filter((p) => (p.from === me.handle && p.to === handle) || (p.from === handle && p.to === me.handle));
  const theirs = payments.filter((p) => canSee(p) && (p.from === handle || p.to === handle) && !between.includes(p)).slice(0, 5);

  return (
    <Screen tabs={false}>
      <BackHeader title="" />
      <div className="flex flex-col items-center px-6 pt-1 text-center">
        <Avatar handle={handle} size={104} />
        <h1 className="mt-4 flex items-center gap-2 text-[26px] font-semibold tracking-tight">
          {person.first} {person.last} <Flag code={person.country} size={22} />
        </h1>
        <p className="text-[16px] text-muted">
          @{person.handle}
          {person.country && <span> · {countryName(person.country)}</span>}
        </p>
        {person.tag && <span className="mt-2 rounded-full bg-brand-soft px-3 py-1 text-[13px] font-semibold text-brand">{person.tag}</span>}
        {state !== "self" && mutual > 0 && (
          <p className="mt-2 text-[14px] text-muted">
            {mutual} {mutual === 1 ? "friend" : "friends"} in common
          </p>
        )}
      </div>

      <div className="px-4 pt-5">
        {state === "self" ? (
          <PrimaryButton href="/me">Go to your profile</PrimaryButton>
        ) : (
          <div className="flex gap-3">
            <PrimaryButton href={`/pay?to=${handle}`} className="flex-1">
              Pay or request
            </PrimaryButton>
            {state === "none" && (
              <GhostButton onClick={() => addFriend(handle)} className="h-14 gap-2 bg-white px-5">
                <UserPlus size={18} /> Add
              </GhostButton>
            )}
            {state === "requested" && (
              <GhostButton className="h-14 gap-2 bg-white px-5 text-muted">
                <Clock size={18} /> Requested
              </GhostButton>
            )}
            {state === "incoming" && (
              <GhostButton onClick={() => acceptFriend(handle)} className="h-14 gap-2 bg-white px-5">
                <Check size={18} /> Accept
              </GhostButton>
            )}
            {state === "friends" && (
              <GhostButton onClick={() => setRemoving(true)} className="h-14 gap-2 bg-white px-5">
                <Check size={18} /> Friends
              </GhostButton>
            )}
          </div>
        )}

        <SectionTitle
          right={
            state === "self" ? (
              <Link href="/me/settings#portfolio" className="hit text-[14px] font-semibold text-brand">
                Edit
              </Link>
            ) : undefined
          }
        >
          {state === "self" ? "Your portfolio, as others see it" : `${person.first}'s portfolio`}
        </SectionTitle>
        <PublicPortfolio
          holdings={holdingsOf(handle)}
          privacy={privacyOf(handle)}
          firstName={person.first}
          self={state === "self"}
          canView={state === "self" || privacyOf(handle).who === "everyone" || state === "friends"}
        />

        {state !== "self" && between.length > 0 && (
          <>
            <SectionTitle>Between you</SectionTitle>
            <Card className="divide-y divide-line py-1">
              {between.map((p) => (
                <ActivityRow key={p.ref} p={p} />
              ))}
            </Card>
          </>
        )}

        <SectionTitle>{state === "self" ? "Your payments" : `${person.first}'s payments`}</SectionTitle>
        {theirs.length + (state === "self" ? between.length : 0) === 0 ? (
          <p className="px-2 py-6 text-center text-muted">
            {state === "friends" || state === "self" ? "Nothing to show yet." : `Add ${person.first} as a friend to see more.`}
          </p>
        ) : (
          <div className="space-y-3">
            {theirs.map((p) => (
              <FeedCard key={p.ref} p={p} />
            ))}
          </div>
        )}
      </div>

      <Sheet open={removing} onClose={() => setRemoving(false)} title={`You and ${person.first} are friends`}>
        <button
          type="button"
          onClick={() => {
            unfriend(handle);
            setRemoving(false);
          }}
          className="flex h-14 w-full items-center justify-center rounded-full bg-chip text-[17px] font-semibold text-down"
        >
          Remove friend
        </button>
        <Link href={`/pay?to=${handle}`} className="mt-2 flex h-14 w-full items-center justify-center rounded-full bg-chip text-[17px] font-semibold">
          Pay or request
        </Link>
      </Sheet>
    </Screen>
  );
}
