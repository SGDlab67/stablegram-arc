// Pure core: no network, no clock. Field names are the ones Gemini returns (see ../NOTES.md).

export type Prices = { bestBid?: string; bestAsk?: string; lastTradePrice?: string };
export type Contract = { label: string; ticker: string; prices?: Prices };
export type Participant = { name: string; abbreviation: string; side: string };
export type GeminiEvent = {
  title: string;
  category: string;
  ticker: string;
  status: string;
  startTime?: string;
  expiryDate: string;
  volume24h?: string;
  participants?: Participant[];
  contracts: Contract[];
};

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
type Day = (typeof DAYS)[number];

export type Venue = {
  name: string;
  city: string;
  timezone: string;
  teams: string[];
  hours: { open: number; close: number }; // hours after local midnight, close 26 = 2am
  baselineCovers: Record<Day, number>;
  patio: { seats: number; turns: number; baselineFactor: number; coolF: number; idealLowF: number; idealHighF: number; hotF: number };
  coversPerServer: number;
  coversPerCook: number;
  scheduled: Record<Day, { servers: number; cooks: number }>;
  gameUplift: number;
  winUplift: number;
  bonusUsd: number;
  foodCostUsd: number;
  supplierDepositPct: number;
  staff: { username: string; role: "server" | "cook" }[];
  supplier: string;
};

export type Factor = { ticker: string; label: string; prob: number; effect: number };
export type Forecast = { day: string; covers: number; baseline: number; factors: Factor[] };
export type Payment = { username: string; amount: bigint; memo: string };
export type Plan = {
  servers: number;
  cooks: number;
  extraServers: number;
  extraCooks: number;
  unfilled: number; // extra shifts with no named staff to pay
  payments: Payment[];
  supplier: Payment | null;
};

const num = (s?: string) => (s === undefined ? undefined : Number(s));

// Gemini books are often one-sided: use the mid when both sides exist, else whichever side does.
export function prob(c: Contract): number {
  const bid = num(c.prices?.bestBid);
  const ask = num(c.prices?.bestAsk);
  if (bid !== undefined && ask !== undefined) return (bid + ask) / 2;
  return ask ?? bid ?? num(c.prices?.lastTradePrice) ?? 0;
}

const dayOfWeek = (day: string) => DAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
const nextDay = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);

function local(iso: string, timeZone: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) + Number(p.minute) / 60 };
}

export const today = (timeZone: string) => local(new Date().toISOString(), timeZone).day;

// The weather ticker's date is the expiry (day after), so the local day comes from the title.
function weatherDay(e: GeminiEvent): string | undefined {
  const m = /on (\w+ \d+, \d{4})/.exec(e.title);
  return m ? new Date(`${m[1]} UTC`).toISOString().slice(0, 10) : undefined;
}

const isWeather = (e: GeminiEvent, venue: Venue, day: string) =>
  e.status === "active" && e.ticker.startsWith(`WXHIGH-${venue.city}-`) && weatherDay(e) === day;

// The local team's side of a moneyline (ticker ends -M). Contracts match participants by abbreviation.
export function localTeam(e: GeminiEvent, venue: Venue) {
  const team = e.participants?.find((p) => venue.teams.some((k) => p.name.toLowerCase().includes(k.toLowerCase())));
  const contract = team && e.contracts.find((c) => c.ticker === team.abbreviation);
  return team && contract ? { team, contract } : undefined;
}

function isGame(e: GeminiEvent, venue: Venue, day: string) {
  if (e.category !== "Sports" || e.status !== "active" || !e.ticker.endsWith("-M") || !e.startTime || !localTeam(e, venue)) return false;
  const t = local(e.startTime, venue.timezone);
  const h = t.day === day ? t.hour : t.day === nextDay(day) ? t.hour + 24 : -1;
  return h >= venue.hours.open && h < venue.hours.close;
}

export function relevantEvents(events: GeminiEvent[], venue: Venue, day: string): GeminiEvent[] {
  const games = events.filter((e) => isGame(e, venue, day)).sort((a, b) => a.startTime!.localeCompare(b.startTime!));
  return [...games, ...events.filter((e) => isWeather(e, venue, day))];
}

// "72°F to 73°F" -> 72.5, "74°F or above" -> 75, "65°F or below" -> 64
export function bucketTemp(label: string): number {
  const range = /(\d+)°F to (\d+)°F/.exec(label);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const open = /(\d+)°F or (above|below)/.exec(label);
  if (!open) throw new Error(`unknown temperature bucket: ${label}`);
  return Number(open[1]) + (open[2] === "above" ? 1 : -1);
}

// Normalized so the probabilities sum to 1. Empty when no bucket has a price.
export function bucketProbs(e: GeminiEvent) {
  const raw = e.contracts.map((c) => ({ label: c.label, temp: bucketTemp(c.label), p: prob(c) }));
  const sum = raw.reduce((s, b) => s + b.p, 0);
  return sum === 0 ? [] : raw.map((b) => ({ ...b, p: b.p / sum })).sort((a, b) => a.temp - b.temp);
}

// 0 below coolF, ramps to 1 at idealLowF, stays 1 to idealHighF, falls to 0 at hotF.
export function patioFactor(t: number, p: Venue["patio"]): number {
  if (t <= p.coolF || t >= p.hotF) return 0;
  if (t < p.idealLowF) return (t - p.coolF) / (p.idealLowF - p.coolF);
  if (t <= p.idealHighF) return 1;
  return (p.hotF - t) / (p.hotF - p.idealHighF);
}

// What the dashboard shows for one market: ticker, title, volume and each outcome's odds.
export function market(e: GeminiEvent, venue: Venue) {
  const odds = e.ticker.startsWith("WXHIGH-") ? bucketProbs(e).map((b) => ({ label: b.label, p: b.p })) : e.contracts.map((c) => ({ label: c.label, p: prob(c) }));
  return { ticker: e.ticker, title: e.title, volume24h: e.volume24h, local: localTeam(e, venue)?.team.name, odds };
}

export function forecast(venue: Venue, day: string, events: GeminiEvent[]): Forecast {
  const baseline = venue.baselineCovers[dayOfWeek(day)];
  const factors: Factor[] = [];
  for (const e of relevantEvents(events, venue, day)) {
    if (e.ticker.startsWith("WXHIGH-")) {
      const b = bucketProbs(e);
      if (!b.length) continue;
      const open = b.reduce((s, x) => s + x.p * patioFactor(x.temp, venue.patio), 0);
      const high = b.reduce((s, x) => s + x.p * x.temp, 0);
      const { seats, turns, baselineFactor } = venue.patio;
      factors.push({ ticker: e.ticker, label: `high ${Math.round(high)}F`, prob: open, effect: Math.round(seats * turns * (open - baselineFactor)) });
    } else {
      const { team, contract } = localTeam(e, venue)!;
      const p = prob(contract);
      factors.push({ ticker: e.ticker, label: `${team.name} ${Math.round(p * 100)}% win`, prob: p, effect: Math.round(baseline * (venue.gameUplift + p * venue.winUplift)) });
    }
  }
  const covers = Math.max(0, baseline + factors.reduce((s, f) => s + f.effect, 0));
  return { day, covers, baseline, factors };
}

const usdc = (dollars: number) => BigInt(Math.round(dollars * 100)) * 10_000n; // 6 decimals

// Cut to the 140 bytes the contract allows.
export function fit(s: string, max = 140): string {
  while (Buffer.byteLength(s) > max) s = s.slice(0, -1);
  return s;
}

export function reason(f: Forecast): string {
  const pct = f.baseline ? Math.round(((f.covers - f.baseline) / f.baseline) * 100) : 0;
  const why = f.factors.map((x) => x.label).join(", ") || "no markets";
  return `${why}: ${pct >= 0 ? "+" : ""}${pct}% covers`;
}

export function plan(venue: Venue, f: Forecast): Plan {
  const sched = venue.scheduled[dayOfWeek(f.day)];
  const servers = Math.max(sched.servers, Math.ceil(f.covers / venue.coversPerServer));
  const cooks = Math.max(sched.cooks, Math.ceil(f.covers / venue.coversPerCook));
  const extraServers = servers - sched.servers;
  const extraCooks = cooks - sched.cooks;
  // The reason, then as many whole tickers as still fit in 140 bytes.
  const why = reason(f);
  const ids: string[] = [];
  for (const x of f.factors) if (Buffer.byteLength(`${why} [${[...ids, x.ticker].join(" ")}]`) <= 140) ids.push(x.ticker);
  const memo = ids.length ? `${why} [${ids.join(" ")}]` : fit(why);
  const named = (role: string, n: number) => venue.staff.filter((s) => s.role === role).slice(0, n);
  const payments = [...named("server", extraServers), ...named("cook", extraCooks)].map((s) => ({
    username: s.username,
    amount: usdc(venue.bonusUsd),
    memo,
  }));
  const deposit = Math.round(f.covers * venue.foodCostUsd * venue.supplierDepositPct);
  return {
    servers,
    cooks,
    extraServers,
    extraCooks,
    unfilled: extraServers + extraCooks - payments.length,
    payments,
    supplier: deposit > 0 ? { username: venue.supplier, amount: usdc(deposit), memo: fit(`Food for ${f.covers} covers, ${reason(f)}`) } : null,
  };
}
