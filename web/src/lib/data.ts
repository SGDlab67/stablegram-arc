// Sample data for the design preview. People and payments are made up.
// Prices are a CoinGecko snapshot from Nov 13 2026; stock prices use the xStocks tokens.

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "stablegram";

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
  payAsset: string;
  receiveAsset: string;
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

export const PEOPLE: Person[] = [
  { handle: "charlie", first: "Charlie", last: "Sneed", color: "#6E54FF" },
  { handle: "taihl", first: "Taihl", last: "Le", color: "#0F9D8A" },
  { handle: "ana", first: "Ana", last: "Rivera", color: "#E8590C" },
  { handle: "wes", first: "Wes", last: "Kim", color: "#1971C2" },
  { handle: "sabina", first: "Sabina", last: "Okafor", color: "#C2255C" },
  { handle: "maya", first: "Maya", last: "Tran", color: "#2F9E44" },
  { handle: "jordan", first: "Jordan", last: "Park", color: "#7048E8" },
  { handle: "dev", first: "Dev", last: "Mehta", color: "#D9480F" },
  { handle: "priya", first: "Priya", last: "Nair", color: "#0B7285" },
  { handle: "luke", first: "Luke", last: "Hansen", color: "#5F3DC4" },
  { handle: "zoe", first: "Zoe", last: "Castillo", color: "#A61E4D" },
  { handle: "sam", first: "Sam", last: "Whitfield", color: "#364FC7" },
];

/** What each person has chosen to be paid in. Missing means "whatever I'm sent". */
export const RECEIVE_PREFS: Record<string, string> = {
  charlie: "NVDA",
  taihl: "NVDA",
  ana: "SPY",
  wes: "BTC",
  sabina: "USDC",
  maya: "TSLA",
  dev: "SOL",
  priya: "EURC",
  zoe: "QQQ",
};

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
  { ref: "p10", from: "sabina", to: "wes", usd: 34, note: "🍕 pizza and burgers", audience: "public", payAsset: "USDC", receiveAsset: "BTC", ago: 4, reactions: { "❤️": ["ana", "maya"], "😂": ["taihl"] }, comments: [{ id: "c1", by: "ana", text: "save me a slice", ago: 3 }], feeUsd: 0.004 },
  { ref: "p9", from: "taihl", to: "charlie", usd: 20, note: "☕ coffee run", audience: "friends", payAsset: "SOL", receiveAsset: "NVDA", ago: 38, reactions: { "🙏": ["charlie"] }, comments: [], feeUsd: 0.005 },
  { ref: "p8", from: "charlie", to: "ana", usd: 48.5, note: "🎟️ Ducks tickets", audience: "public", payAsset: "NVDA", receiveAsset: "SPY", ago: 95, reactions: { "🔥": ["wes", "taihl", "maya"] }, comments: [{ id: "c2", by: "ana", text: "go ducks", ago: 90 }], feeUsd: 0.005 },
  { ref: "p7", from: "maya", to: "taihl", usd: 12, note: "🌮 taco tuesday", audience: "public", payAsset: "TSLA", receiveAsset: "NVDA", ago: 160, reactions: { "😂": ["ana"] }, comments: [], feeUsd: 0.005 },
  { ref: "p6", from: "dev", to: "priya", usd: 60, note: "✈️ Lisbon hostel", audience: "public", payAsset: "USDC", receiveAsset: "EURC", ago: 240, reactions: { "✨": ["zoe"] }, comments: [], feeUsd: 0.006 },
  { ref: "p5", from: "wes", to: "charlie", usd: 15, note: "⛽ gas money", audience: "private", payAsset: "BTC", receiveAsset: "NVDA", ago: 420, reactions: {}, comments: [], feeUsd: 0.005 },
  { ref: "p4", from: "luke", to: "zoe", usd: 25, note: "🎂 birthday dinner", audience: "public", payAsset: "ETH", receiveAsset: "QQQ", ago: 600, reactions: { "❤️": ["sam"] }, comments: [], feeUsd: 0.005 },
  { ref: "p3", from: "charlie", to: "sabina", usd: 9, note: "🍻 last night", audience: "friends", payAsset: "USDC", receiveAsset: "USDC", ago: 1500, reactions: { "😂": ["sabina"] }, comments: [], feeUsd: 0.004 },
  { ref: "p2", from: "ana", to: "maya", usd: 400, note: "🏠 rent", audience: "friends", payAsset: "SPY", receiveAsset: "TSLA", ago: 2900, reactions: {}, comments: [], feeUsd: 0.005 },
  { ref: "p1", from: "sam", to: "jordan", usd: 18, note: "🛒 groceries", audience: "public", payAsset: "SOL", receiveAsset: "SOL", ago: 4300, reactions: {}, comments: [], feeUsd: 0.004 },
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

export function amountLabel(amount: number, symbol: string): string {
  const digits = amount >= 100 ? 2 : amount >= 1 ? 3 : amount >= 0.01 ? 4 : 6;
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: digits })} ${symbol}`;
}

/** A deterministic sample price path that ends at the asset's current price. */
export function sampleSeries(symbol: string, points = 48): number[] {
  const a = assetOf(symbol);
  let seed = 0;
  for (const ch of symbol) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
  const rand = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  const start = a.price / (1 + a.change24h / 100);
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const drift = start + (a.price - start) * t;
    const wobble = a.group === "cash" ? 0 : (rand() - 0.5) * a.price * 0.012 * Math.sin(Math.PI * t);
    out.push(drift + wobble);
  }
  out[points - 1] = a.price;
  return out;
}
