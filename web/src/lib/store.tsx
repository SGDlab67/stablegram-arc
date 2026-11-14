"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  ASSETS,
  FRIENDS,
  INCOMING_FRIEND_REQUESTS,
  ME,
  MY_HOLDINGS,
  NOTICES,
  OTHER_FRIENDSHIPS,
  PAYMENTS,
  PEOPLE,
  REQUESTS,
  STARTER_ASSET_USD,
  STARTER_DOLLARS,
  assetOf,
  type Audience,
  type MoneyRequest,
  type Notice,
  type Payment,
  type Person,
} from "./data";

export type FriendState = "none" | "requested" | "incoming" | "friends" | "self";

interface PayInput {
  to: string;
  usd: number;
  note: string;
  audience: Audience;
  asset: string;
  requestId?: string;
}

export interface SignUpInput {
  handle: string;
  first: string;
  last: string;
  color: string;
  photo?: string;
  /** The first stock the new person picked. "USDC" means they only want dollars to start. */
  firstAsset: string;
  audience: Audience;
}

interface Store {
  me: Person;
  /** True while the preview is showing the made-up account rather than one created through sign-up. */
  isSample: boolean;
  people: Person[];
  payments: Payment[];
  requests: MoneyRequest[];
  notices: Notice[];
  holdings: Record<string, number>;
  defaultAudience: Audience;
  friends: string[];
  incoming: string[];
  outgoing: string[];
  totalUsd: number;
  /** Dollar figures are masked, for when someone else is looking at the screen. */
  hideBalances: boolean;
  toggleHideBalances: () => void;
  friendState: (handle: string) => FriendState;
  areFriends: (a: string, b: string) => boolean;
  canSee: (p: Payment) => boolean;
  signUp: (input: SignUpInput) => void;
  resetToSample: () => void;
  pay: (input: PayInput) => Payment;
  request: (from: string[], usdEach: number, note: string) => void;
  declineRequest: (id: string) => void;
  cancelRequest: (id: string) => void;
  react: (ref: string, emoji: string) => void;
  comment: (ref: string, text: string) => void;
  addFriend: (handle: string) => void;
  acceptFriend: (handle: string) => void;
  ignoreFriend: (handle: string) => void;
  unfriend: (handle: string) => void;
  setDefaultAudience: (a: Audience) => void;
  updateMe: (patch: Partial<Person>) => void;
  buy: (symbol: string, dollars: number) => void;
  /** Buy with outside money (Apple Pay, card, Venmo…): adds the asset without touching the dollar balance. */
  buyWithOutside: (symbol: string, dollars: number) => void;
  sell: (symbol: string, dollars: number) => void;
}

const Ctx = createContext<Store | null>(null);
const NO_NOTICES: Notice[] = [];

let counter = 100;
const nextId = (prefix: string) => `${prefix}${++counter}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>(PEOPLE);
  const [payments, setPayments] = useState<Payment[]>(PAYMENTS);
  const [requests, setRequests] = useState<MoneyRequest[]>(REQUESTS);
  const [meHandle, setMeHandle] = useState<string>(ME);
  const [holdings, setHoldings] = useState<Record<string, number>>(MY_HOLDINGS);
  const [defaultAudience, setDefaultAudience] = useState<Audience>("public");
  const [friends, setFriends] = useState<string[]>(FRIENDS);
  const [incoming, setIncoming] = useState<string[]>(INCOMING_FRIEND_REQUESTS);
  const [outgoing, setOutgoing] = useState<string[]>([]);
  const [hideBalances, setHideBalances] = useState(false);
  const toggleHideBalances = useCallback(() => setHideBalances((v) => !v), []);

  const me = useMemo(() => people.find((p) => p.handle === meHandle) ?? PEOPLE[0], [people, meHandle]);
  const isSample = meHandle === ME;
  // The sample notifications belong to the sample account. A new account starts with none.
  const notices: Notice[] = isSample ? NOTICES : NO_NOTICES;

  const areFriends = useCallback(
    (a: string, b: string) => {
      if (a === b) return true;
      if (a === meHandle) return friends.includes(b);
      if (b === meHandle) return friends.includes(a);
      return OTHER_FRIENDSHIPS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    },
    [friends, meHandle],
  );

  const friendState = useCallback(
    (handle: string): FriendState => {
      if (handle === meHandle) return "self";
      if (friends.includes(handle)) return "friends";
      if (incoming.includes(handle)) return "incoming";
      if (outgoing.includes(handle)) return "requested";
      return "none";
    },
    [friends, incoming, outgoing, meHandle],
  );

  const canSee = useCallback(
    (p: Payment) => {
      if (p.from === meHandle || p.to === meHandle) return true;
      if (p.audience === "public") return true;
      return false;
    },
    [meHandle],
  );

  const pay = useCallback(
    (input: PayInput): Payment => {
      const units = input.usd / assetOf(input.asset).price;
      const payment: Payment = {
        ref: nextId("p"),
        from: meHandle,
        to: input.to,
        usd: input.usd,
        note: input.note,
        audience: input.audience,
        asset: input.asset,
        ago: 0,
        reactions: {},
        comments: [],
        feeUsd: 0.005,
      };
      setHoldings((h) => ({ ...h, [input.asset]: Math.max(0, (h[input.asset] ?? 0) - units) }));
      setPayments((list) => [payment, ...list]);
      if (input.requestId) {
        setRequests((list) => list.map((r) => (r.id === input.requestId ? { ...r, status: "paid" } : r)));
      }
      return payment;
    },
    [meHandle],
  );

  const request = useCallback((from: string[], usdEach: number, note: string) => {
    setRequests((list) => [
      ...from.map((payer) => ({ id: nextId("r"), requester: meHandle, payer, usd: usdEach, note, status: "open" as const, ago: 0 })),
      ...list,
    ]);
  }, [meHandle]);

  const declineRequest = useCallback((id: string) => {
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status: "declined" } : r)));
  }, []);

  const cancelRequest = useCallback((id: string) => {
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
  }, []);

  const react = useCallback((ref: string, emoji: string) => {
    setPayments((list) =>
      list.map((p) => {
        if (p.ref !== ref) return p;
        const next: Record<string, string[]> = {};
        let had = false;
        for (const [e, who] of Object.entries(p.reactions)) {
          const without = who.filter((h) => h !== meHandle);
          if (e === emoji && who.includes(meHandle)) had = true;
          if (without.length) next[e] = without;
        }
        if (!had) next[emoji] = [...(next[emoji] ?? []), meHandle];
        return { ...p, reactions: next };
      }),
    );
  }, [meHandle]);

  const comment = useCallback((ref: string, text: string) => {
    setPayments((list) =>
      list.map((p) => (p.ref === ref ? { ...p, comments: [...p.comments, { id: nextId("c"), by: meHandle, text, ago: 0 }] } : p)),
    );
  }, [meHandle]);

  const addFriend = useCallback((handle: string) => setOutgoing((o) => (o.includes(handle) ? o : [...o, handle])), []);
  const acceptFriend = useCallback((handle: string) => {
    setIncoming((i) => i.filter((h) => h !== handle));
    setFriends((f) => (f.includes(handle) ? f : [...f, handle]));
  }, []);
  const ignoreFriend = useCallback((handle: string) => setIncoming((i) => i.filter((h) => h !== handle)), []);
  const unfriend = useCallback((handle: string) => setFriends((f) => f.filter((h) => h !== handle)), []);

  const updateMe = useCallback((patch: Partial<Person>) => {
    setPeople((list) => list.map((p) => (p.handle === meHandle ? { ...p, ...patch, handle: meHandle } : p)));
  }, [meHandle]);

  const signUp = useCallback((input: SignUpInput) => {
    const person: Person = { handle: input.handle, first: input.first, last: input.last, color: input.color, photo: input.photo };
    setPeople((list) => [person, ...list.filter((p) => p.handle !== input.handle)]);
    setMeHandle(input.handle);
    setFriends([]);
    setIncoming([]);
    setOutgoing([]);
    setHoldings(
      input.firstAsset === "USDC"
        ? { USDC: STARTER_DOLLARS + STARTER_ASSET_USD }
        : { USDC: STARTER_DOLLARS, [input.firstAsset]: STARTER_ASSET_USD / assetOf(input.firstAsset).price },
    );
    setDefaultAudience(input.audience);
  }, []);

  const resetToSample = useCallback(() => {
    setPeople(PEOPLE);
    setMeHandle(ME);
    setPayments(PAYMENTS);
    setRequests(REQUESTS);
    setHoldings(MY_HOLDINGS);
    setDefaultAudience("public");
    setFriends(FRIENDS);
    setIncoming(INCOMING_FRIEND_REQUESTS);
    setOutgoing([]);
  }, []);

  const buy = useCallback((symbol: string, dollars: number) => {
    const price = assetOf(symbol).price;
    setHoldings((h) => ({ ...h, USDC: Math.max(0, (h.USDC ?? 0) - dollars), [symbol]: (h[symbol] ?? 0) + dollars / price }));
  }, []);

  const buyWithOutside = useCallback((symbol: string, dollars: number) => {
    const price = assetOf(symbol).price;
    setHoldings((h) => ({ ...h, [symbol]: (h[symbol] ?? 0) + dollars / price }));
  }, []);

  const sell = useCallback((symbol: string, dollars: number) => {
    const price = assetOf(symbol).price;
    setHoldings((h) => ({ ...h, USDC: (h.USDC ?? 0) + dollars, [symbol]: Math.max(0, (h[symbol] ?? 0) - dollars / price) }));
  }, []);

  const totalUsd = useMemo(
    () => ASSETS.reduce((sum, a) => sum + (holdings[a.symbol] ?? 0) * a.price, 0),
    [holdings],
  );

  const value: Store = {
    me,
    isSample,
    people,
    payments,
    requests,
    notices,
    holdings,
    defaultAudience,
    friends,
    incoming,
    outgoing,
    totalUsd,
    hideBalances,
    toggleHideBalances,
    friendState,
    areFriends,
    canSee,
    signUp,
    resetToSample,
    pay,
    request,
    declineRequest,
    cancelRequest,
    react,
    comment,
    addFriend,
    acceptFriend,
    ignoreFriend,
    unfriend,
    setDefaultAudience,
    updateMe,
    buy,
    buyWithOutside,
    sell,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
