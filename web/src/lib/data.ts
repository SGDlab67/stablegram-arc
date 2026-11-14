// Sample data for the design preview. People and payments are made up.
// Prices are a CoinGecko snapshot from Nov 13 2026; stock prices use the xStocks tokens.

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Settle";

export type Audience = "public" | "friends" | "private";
export type AssetGroup = "stocks" | "crypto" | "cash";

export interface Asset {
  symbol: string;
  name: string;
  group: AssetGroup;
  price: number;
  change24h: number;
  color: string;
  demo: boolean;
  about: string;
}

export interface Person {
  handle: string;
  first: string;
  last: string;
  color: string;
  /** A small square image as a data URL. Missing means initials on the colour. */
  photo?: string;
}

export interface Comment {
  id: string;
  by: string;
  text: string;
  ago: number;
}

export interface Payment {
  ref: string;
  from: string;
  to: string;
  usd: number;
  note: string;
  audience: Audience;
  /** What was sent. The receiver gets exactly this asset: no conversion. They can sell it for dollars any time. */
  asset: string;
  /** minutes ago */
  ago: number;
  reactions: Record<string, string[]>;
  comments: Comment[];
  feeUsd: number;
}

export interface MoneyRequest {
  id: string;
  requester: string;
  payer: string;
  usd: number;
  note: string;
  status: "open" | "paid" | "declined" | "cancelled";
  ago: number;
}

export interface Notice {
  id: string;
  kind: "friend_request" | "money_request" | "paid" | "reaction" | "comment";
  actor: string;
  text: string;
  ago: number;
  href: string;
}

export const ME = "charlie";

export const ASSETS: Asset[] = [
  { symbol: "NVDA", name: "NVIDIA", group: "stocks", price: 161.56, change24h: -4.07, color: "#76B900", demo: true, about: "Designs the chips behind most AI training and gaming graphics." },
  { symbol: "TSLA", name: "Tesla", group: "stocks", price: 387.54, change24h: -3.07, color: "#E31937", demo: true, about: "Electric vehicles, batteries and energy storage." },
  { symbol: "SPY", name: "S&P 500", group: "stocks", price: 754.96, change24h: -1.32, color: "#1C4E80", demo: true, about: "A fund that tracks 500 of the largest US companies." },
  { symbol: "QQQ", name: "Nasdaq 100", group: "stocks", price: 676.16, change24h: -2.54, color: "#0096D6", demo: true, about: "A fund that tracks the 100 largest non-financial Nasdaq companies." },
  { symbol: "AAPL", name: "Apple", group: "stocks", price: 357.11, change24h: 0.25, color: "#555555", demo: true, about: "iPhone, Mac and services." },
  { symbol: "CRCL", name: "Circle", group: "stocks", price: 61.53, change24h: -4.17, color: "#3D7BF7", demo: true, about: "Issuer of the USDC and EURC stablecoins." },
  { symbol: "COIN", name: "Coinbase", group: "stocks", price: 126.45, change24h: -3.67, color: "#0052FF", demo: true, about: "A US crypto exchange and custodian." },
  { symbol: "GOLD", name: "Gold", group: "stocks", price: 3876.17, change24h: -0.17, color: "#C9A227", demo: true, about: "One troy ounce of gold, tokenized." },
  { symbol: "BTC", name: "Bitcoin", group: "crypto", price: 68279, change24h: -4.23, color: "#F7931A", demo: true, about: "The first and largest cryptocurrency." },
  { symbol: "ETH", name: "Ethereum", group: "crypto", price: 1933.11, change24h: -4.07, color: "#627EEA", demo: true, about: "The network most on-chain apps are built on." },
  { symbol: "SOL", name: "Solana", group: "crypto", price: 78.38, change24h: -3.92, color: "#9945FF", demo: true, about: "A fast, low-fee network." },
  { symbol: "MON", name: "Monad", group: "crypto", price: 0.01677, change24h: -3.0, color: "#6E54FF", demo: true, about: "A high-throughput EVM network." },
  { symbol: "USDC", name: "US Dollar", group: "cash", price: 1, change24h: 0, color: "#2775CA", demo: false, about: "A digital dollar issued by Circle. On Arc it also pays the network fee." },
  { symbol: "EURC", name: "Euro", group: "cash", price: 1.1, change24h: -0.3, color: "#1A3E9C", demo: false, about: "A digital euro issued by Circle." },
];

export const STARTER_CHOICES = ["NVDA", "TSLA", "SPY", "QQQ", "USDC"];
/** A new account picks its first stock and starts with a little of it plus some dollars. Matches the Arc column of the sign-up grants in spec/SEED-DATA.md. */
export const STARTER_DOLLARS = 4;
export const STARTER_ASSET_USD = 3;

export const AVATAR_COLORS = ["#1F4F82", "#0F9D8A", "#E8590C", "#1971C2", "#C2255C", "#2F9E44", "#D9480F", "#364FC7"];
export const RESERVED_HANDLES = ["admin", "support", "help", "settle", "stablegram", "pay", "request", "requests", "me", "home", "friends", "portfolio", "settings", "everyone", "welcome"];
export const HANDLE_RULE = /^[a-z0-9_]{3,20}$/;

export const PEOPLE: Person[] = [
  { handle: "charlie", first: "Charlie", last: "Sneed", color: "#1F4F82" },
  { handle: "taihl", first: "Taihl", last: "Le", color: "#0F9D8A" },
  { handle: "ana", first: "Ana", last: "Rivera", color: "#E8590C" },
  { handle: "wes", first: "Wes", last: "Kim", color: "#1971C2" },
  { handle: "sabina", first: "Sabina", last: "Okafor", color: "#C2255C" },
  { handle: "maya", first: "Maya", last: "Tran", color: "#2F9E44" },
  { handle: "jordan", first: "Jordan", last: "Park", color: "#B5651D" },
  { handle: "dev", first: "Dev", last: "Mehta", color: "#D9480F" },
  { handle: "priya", first: "Priya", last: "Nair", color: "#0B7285" },
  { handle: "luke", first: "Luke", last: "Hansen", color: "#5C7A99" },
  { handle: "zoe", first: "Zoe", last: "Castillo", color: "#A61E4D" },
  { handle: "sam", first: "Sam", last: "Whitfield", color: "#364FC7" },
];

export const MY_HOLDINGS: Record<string, number> = {
  USDC: 42.5,
  NVDA: 0.31,
  SOL: 1.85,
  TSLA: 0.05,
  BTC: 0.0012,
  GOLD: 0.004,
  EURC: 12,
};

export const FRIENDS: string[] = ["taihl", "ana", "wes", "sabina", "maya"];
export const INCOMING_FRIEND_REQUESTS: string[] = ["jordan"];

/** Who the other sample people are friends with, for the Friends audience. */
export const OTHER_FRIENDSHIPS: [string, string][] = [
  ["ana", "wes"],
  ["sabina", "wes"],
  ["maya", "taihl"],
  ["dev", "priya"],
  ["luke", "zoe"],
  ["sam", "jordan"],
  ["ana", "dev"],
];

export const PAYMENTS: Payment[] = [
  { ref: "p10", from: "sabina", to: "wes", usd: 34, note: "🍕 pizza and burgers", audience: "public", asset: "BTC", ago: 4, reactions: { "❤️": ["ana", "maya"], "😂": ["taihl"] }, comments: [{ id: "c1", by: "ana", text: "save me a slice", ago: 3 }], feeUsd: 0.004 },
  { ref: "p9", from: "taihl", to: "charlie", usd: 20, note: "☕ coffee run", audience: "friends", asset: "NVDA", ago: 38, reactions: { "🙏": ["charlie"] }, comments: [], feeUsd: 0.005 },
  { ref: "p8", from: "charlie", to: "ana", usd: 48.5, note: "🎟️ Ducks tickets", audience: "public", asset: "NVDA", ago: 95, reactions: { "🔥": ["wes", "taihl", "maya"] }, comments: [{ id: "c2", by: "ana", text: "go ducks", ago: 90 }], feeUsd: 0.005 },
  { ref: "p7", from: "maya", to: "taihl", usd: 12, note: "🌮 taco tuesday", audience: "public", asset: "TSLA", ago: 160, reactions: { "😂": ["ana"] }, comments: [], feeUsd: 0.005 },
  { ref: "p6", from: "dev", to: "priya", usd: 60, note: "✈️ Lisbon hostel", audience: "public", asset: "USDC", ago: 240, reactions: { "✨": ["zoe"] }, comments: [], feeUsd: 0.006 },
  { ref: "p5", from: "wes", to: "charlie", usd: 15, note: "⛽ gas money", audience: "private", asset: "BTC", ago: 420, reactions: {}, comments: [], feeUsd: 0.005 },
  { ref: "p4", from: "luke", to: "zoe", usd: 25, note: "🎂 birthday dinner", audience: "public", asset: "ETH", ago: 600, reactions: { "❤️": ["sam"] }, comments: [], feeUsd: 0.005 },
  { ref: "p3", from: "charlie", to: "sabina", usd: 9, note: "🍻 last night", audience: "friends", asset: "USDC", ago: 1500, reactions: { "😂": ["sabina"] }, comments: [], feeUsd: 0.004 },
  { ref: "p2", from: "ana", to: "maya", usd: 400, note: "🏠 rent", audience: "friends", asset: "SPY", ago: 2900, reactions: {}, comments: [], feeUsd: 0.005 },
  { ref: "p1", from: "sam", to: "jordan", usd: 18, note: "🛒 groceries", audience: "public", asset: "SOL", ago: 4300, reactions: {}, comments: [], feeUsd: 0.004 },
];

export const REQUESTS: MoneyRequest[] = [
  { id: "r2", requester: "maya", payer: "charlie", usd: 22, note: "🍜 ramen", status: "open", ago: 50 },
  { id: "r1", requester: "charlie", payer: "wes", usd: 30, note: "🏠 utilities", status: "open", ago: 300 },
];

export const NOTICES: Notice[] = [
  { id: "n4", kind: "money_request", actor: "maya", text: "requested $22 for 🍜 ramen", ago: 50, href: "/requests" },
  { id: "n3", kind: "paid", actor: "taihl", text: "paid you $20 for ☕ coffee run", ago: 38, href: "/p/p9" },
  { id: "n2", kind: "friend_request", actor: "jordan", text: "wants to be friends", ago: 120, href: "/friends" },
  { id: "n1", kind: "reaction", actor: "wes", text: "reacted 🔥 to 🎟️ Ducks tickets", ago: 94, href: "/p/p8" },
];

export const REACTION_CHOICES = ["❤️", "😂", "🔥", "🙏", "💸", "✨"];
export const NOTE_SHORTCUTS = ["🍕", "🍔", "🌮", "☕", "🍻", "🏠", "🚗", "⛽", "🎟️", "🎉", "🛒", "✈️", "💸", "🎂", "🏀"];

const TILE_COLORS = ["#FF8A1F", "#FFD43B", "#63E6BE", "#74C0FC", "#B197FC", "#FF8787", "#A9E34B", "#F783AC"];

export function assetOf(symbol: string): Asset {
  return ASSETS.find((a) => a.symbol === symbol) ?? ASSETS[ASSETS.length - 2];
}

export function personOf(handle: string, people: Person[] = PEOPLE): Person {
  return people.find((p) => p.handle === handle) ?? { handle, first: handle, last: "", color: "#868E96" };
}

export function shortName(p: Person): string {
  return p.last ? `${p.first} ${p.last[0]}.` : p.first;
}

export function initials(p: Person): string {
  return `${p.first[0] ?? ""}${p.last[0] ?? ""}`.toUpperCase();
}

const EMOJI_RE = new RegExp("\\p{Extended_Pictographic}(\\uFE0F)?", "u");

export function emojiOf(note: string): string | null {
  const m = note.match(EMOJI_RE);
  return m ? m[0] : null;
}

export function textOf(note: string): string {
  const e = emojiOf(note);
  const t = e ? note.replace(e, "").trim() : note.trim();
  return t || note.trim();
}

export function tileColor(emoji: string): string {
  const code = emoji.codePointAt(0) ?? 0;
  return TILE_COLORS[code % TILE_COLORS.length];
}

export function agoLabel(minutes: number): string {
  if (minutes < 1) return "now";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 60 / 24)}d`;
}

export function usd(n: number, opts: { cents?: boolean } = {}): string {
  const whole = Number.isInteger(n) && !opts.cents;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** The network fee is a fraction of a cent, which a two-decimal dollar figure would round up to a whole cent. */
export function feeLabel(n: number): string {
  return n < 0.01 ? "under 1¢" : `about ${usd(n, { cents: true })}`;
}

export function amountLabel(amount: number, symbol: string): string {
  const digits = amount >= 100 ? 2 : amount >= 1 ? 3 : amount >= 0.01 ? 4 : 6;
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: digits })} ${symbol}`;
}

export type Range = "1D" | "1W" | "1M" | "6M" | "1Y" | "All";

/** How the change over each range is worded, and how many minutes the range covers. */
export const RANGES: Record<Range, { words: string; minutes: number; swing: number; rough: number }> = {
  "1D": { words: "today", minutes: 60 * 24, swing: 0, rough: 0.012 },
  "1W": { words: "past week", minutes: 60 * 24 * 7, swing: 6, rough: 0.03 },
  "1M": { words: "past month", minutes: 60 * 24 * 30, swing: 12, rough: 0.05 },
  "6M": { words: "past 6 months", minutes: 60 * 24 * 182, swing: 30, rough: 0.09 },
  "1Y": { words: "past year", minutes: 60 * 24 * 365, swing: 55, rough: 0.12 },
  All: { words: "all time", minutes: 60 * 24 * 730, swing: 120, rough: 0.16 },
};

function seeded(text: string): () => number {
  let seed = 7;
  for (const ch of text) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
}

/**
 * Percent move over a range. "1D" is the real 24-hour change from the price snapshot.
 * Longer ranges are made up, and fixed per asset so the chart does not jump between visits.
 */
export function sampleChange(symbol: string, range: Range = "1D"): number {
  const a = assetOf(symbol);
  if (range === "1D") return a.change24h;
  const rand = seeded(`${symbol}:${range}:change`);
  const move = (rand() - 0.42) * 2 * RANGES[range].swing;
  return a.group === "cash" ? (symbol === "USDC" ? 0 : move * 0.05) : move;
}

/** A deterministic sample price path that ends at the asset's current price. */
export function sampleSeries(symbol: string, points = 48, range: Range = "1D"): number[] {
  const a = assetOf(symbol);
  const rand = seeded(`${symbol}:${range}`);
  const start = a.price / (1 + sampleChange(symbol, range) / 100);
  // A random walk pinned to zero at both ends, so the line wanders but still lands on today's price.
  const walk: number[] = [0];
  for (let i = 1; i < points; i++) walk.push(walk[i - 1] + (rand() - 0.5));
  const rough = a.group === "cash" ? (symbol === "USDC" ? 0 : RANGES[range].rough * 0.1) : RANGES[range].rough;
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const drift = start + (a.price - start) * t;
    const pinned = walk[i] - t * walk[points - 1];
    out.push(Math.max(drift + a.price * rough * pinned, a.price * 0.02));
  }
  out[points - 1] = a.price;
  return out;
}
