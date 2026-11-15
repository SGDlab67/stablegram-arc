// Sample data for the design preview. People and payments are made up.
// Crypto prices: Blockworks asset-price, daily close 2026-11-13 UTC (change vs the day before), pulled 2026-11-14T22:56Z.
// Stock prices: CoinGecko xStocks tokens (Blockworks does not carry them), pulled 2026-11-14T22:56Z. Logos: Blockworks for crypto
// (CoinGecko where its image was too small), xStocks token images for stocks.
// Gold, Tether Gold, US Treasuries (USDY) and BlackRock (BUIDL): Blockworks asset-price, daily close 2026-11-13 UTC.
// Dollar stablecoins are shown at their $1 peg (Blockworks closes were 0.9993-0.9997). EURC: Blockworks asset-price, daily close 2026-11-14. Logos: CoinGecko large images, 256 px.
// Silver (KAG): CoinGecko (not on Blockworks). All pulled 2026-11-14T23:32Z.

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Osmo";

/** Who can see a payment in feeds. Two choices only: everyone, or just the two people. */
export type Audience = "public" | "private";
export type AssetGroup = "stocks" | "crypto" | "cash";
/** The finer category used on the Markets screen. Metals and treasuries count as "stocks" (stocks and real-world assets) in the portfolio. */
export type Market = "stocks" | "crypto" | "metals" | "treasuries" | "cash";

export const MARKETS: { id: Market; label: string }[] = [
  { id: "stocks", label: "Stocks" },
  { id: "crypto", label: "Crypto" },
  { id: "metals", label: "Gold & silver" },
  { id: "treasuries", label: "Treasuries" },
  { id: "cash", label: "Stablecoins" },
];

export interface Asset {
  symbol: string;
  name: string;
  group: AssetGroup;
  market: Market;
  price: number;
  change24h: number;
  color: string;
  demo: boolean;
  /** Square logo in /public/logos, shown in a circle. */
  logo?: string;
  about: string;
}

export interface Person {
  handle: string;
  first: string;
  last: string;
  color: string;
  /** A small square image as a data URL. Missing means initials on the colour. */
  photo?: string;
  /** Self-reported country (ISO code) shown as a flag next to the name. Never verified. */
  country?: string;
  /** The wallet payments to this username go to. */
  address?: string;
  /** A group label shown on the profile, e.g. the event someone is at. */
  tag?: string;
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
  { symbol: "NVDA", name: "NVIDIA", group: "stocks", market: "stocks", price: 159.22, change24h: -1.41, color: "#76B900", demo: true, logo: "/logos/NVDA.svg", about: "Designs the chips behind most AI training and gaming graphics." },
  { symbol: "TSLA", name: "Tesla", group: "stocks", market: "stocks", price: 382.72, change24h: -1.33, color: "#E31937", demo: true, logo: "/logos/TSLA.png", about: "Electric vehicles, batteries and energy storage." },
  { symbol: "AAPL", name: "Apple", group: "stocks", market: "stocks", price: 356.45, change24h: -0.07, color: "#555555", demo: true, logo: "/logos/AAPL.png", about: "iPhone, Mac and services." },
  { symbol: "GOOGL", name: "Google", group: "stocks", market: "stocks", price: 291.05, change24h: -1.22, color: "#4285F4", demo: true, logo: "/logos/GOOGL.png", about: "Alphabet: Google search, YouTube, Android and Google Cloud." },
  { symbol: "AMZN", name: "Amazon", group: "stocks", market: "stocks", price: 262.27, change24h: -0.95, color: "#FF9900", demo: true, logo: "/logos/AMZN.png", about: "Online shopping, Prime and Amazon Web Services." },
  { symbol: "META", name: "Meta", group: "stocks", market: "stocks", price: 634.71, change24h: -0.75, color: "#0866FF", demo: true, logo: "/logos/META.png", about: "Facebook, Instagram, WhatsApp and Quest headsets." },
  { symbol: "MSFT", name: "Microsoft", group: "stocks", market: "stocks", price: 521.87, change24h: -0.5, color: "#00A4EF", demo: true, logo: "/logos/MSFT.png", about: "Windows, Office, Xbox and Azure cloud." },
  { symbol: "NFLX", name: "Netflix", group: "stocks", market: "stocks", price: 61.54, change24h: -0.87, color: "#E50914", demo: true, logo: "/logos/NFLX.png", about: "Streaming films and series." },
  { symbol: "COIN", name: "Coinbase", group: "stocks", market: "stocks", price: 116.35, change24h: -8.03, color: "#0052FF", demo: true, logo: "/logos/COIN.png", about: "A US crypto exchange and custodian." },
  { symbol: "CRCL", name: "Circle", group: "stocks", market: "stocks", price: 55.64, change24h: -9.97, color: "#3D7BF7", demo: true, logo: "/logos/CRCL.png", about: "Issuer of the USDC and EURC stablecoins." },
  { symbol: "PAXG", name: "Gold", group: "stocks", market: "metals", price: 3875.01, change24h: -0.09, color: "#D4AF37", demo: true, logo: "/logos/PAXG.png", about: "PAX Gold. Each token is one troy ounce of gold in a London vault, issued by Paxos." },
  { symbol: "XAUT", name: "Tether Gold", group: "stocks", market: "metals", price: 3872.45, change24h: -0.1, color: "#C9A646", demo: true, logo: "/logos/XAUT.png", about: "Each token is one troy ounce of gold in a Swiss vault, issued by Tether." },
  { symbol: "KAG", name: "Silver", group: "stocks", market: "metals", price: 48.72, change24h: -0.22, color: "#9AA0A6", demo: true, logo: "/logos/KAG.png", about: "Kinesis Silver. Each token is one troy ounce of silver held in a vault." },
  { symbol: "USDY", name: "US Treasuries", group: "stocks", market: "treasuries", price: 1.1512, change24h: -0.13, color: "#0E2A5C", demo: true, logo: "/logos/USDY.png", about: "Ondo US Dollar Yield. Backed by short-term US Treasuries and bank deposits; the price rises slowly as interest builds up." },
  { symbol: "BUIDL", name: "BlackRock Treasury Fund", group: "stocks", market: "treasuries", price: 0.9997, change24h: 0.0, color: "#000000", demo: true, logo: "/logos/BUIDL.png", about: "BlackRock USD Institutional Digital Liquidity Fund. Holds cash and US Treasury bills and stays near $1; interest is paid out as new tokens." },
  { symbol: "BTC", name: "Bitcoin", group: "crypto", market: "crypto", price: 68245.0, change24h: -4.35, color: "#F7931A", demo: true, logo: "/logos/BTC.png", about: "The first and largest cryptocurrency." },
  { symbol: "ETH", name: "Ethereum", group: "crypto", market: "crypto", price: 1927.77, change24h: -4.42, color: "#627EEA", demo: true, logo: "/logos/ETH.png", about: "The network most on-chain apps are built on." },
  { symbol: "SOL", name: "Solana", group: "crypto", market: "crypto", price: 78.14, change24h: -4.28, color: "#9945FF", demo: true, logo: "/logos/SOL.png", about: "A fast, low-fee network." },
  { symbol: "MON", name: "Monad", group: "crypto", market: "crypto", price: 0.01674, change24h: -3.29, color: "#836EF9", demo: true, logo: "/logos/MON.png", about: "A high-throughput EVM network." },
  { symbol: "USDC", name: "USD Coin", group: "cash", market: "cash", price: 1, change24h: 0, color: "#2775CA", demo: false, logo: "/logos/USDC.png", about: "USDC, the digital dollar issued by Circle. Always worth $1, redeemable 1:1. On Arc it also pays the network fee." },
  { symbol: "USDT", name: "Tether USD", group: "cash", market: "cash", price: 1, change24h: 0, color: "#26A17B", demo: true, logo: "/logos/USDT.png", about: "USDT, the most used dollar stablecoin, issued by Tether. Tracks $1." },
  { symbol: "PYUSD", name: "PayPal USD", group: "cash", market: "cash", price: 1, change24h: 0, color: "#0070E0", demo: true, logo: "/logos/PYUSD.png", about: "PYUSD, PayPal's dollar stablecoin, issued by Paxos. Tracks $1, and also lives in PayPal and Venmo." },
  { symbol: "DAI", name: "Dai", group: "cash", market: "cash", price: 1, change24h: 0, color: "#F5AC37", demo: true, logo: "/logos/DAI.png", about: "DAI, a dollar stablecoin run on-chain by the Sky (formerly Maker) protocol. Tracks $1." },
  { symbol: "EURC", name: "Euro Coin", group: "cash", market: "cash", price: 1.1002, change24h: -0.13, color: "#1A3E9C", demo: false, logo: "/logos/EURC.png", about: "EURC, the digital euro issued by Circle. Always worth €1." },
];

/** Every new account starts with a little NVIDIA plus dollars (demo). No question in sign-up for it. */
export const STARTER_ASSET = "NVDA";
/** A new account picks its first stock and starts with a little of it plus some dollars. Matches the Arc column of the sign-up grants in spec/SEED-DATA.md. */
export const STARTER_DOLLARS = 4;
export const STARTER_ASSET_USD = 3;

export const AVATAR_COLORS = ["#1F4F82", "#0F9D8A", "#E8590C", "#1971C2", "#C2255C", "#2F9E44", "#D9480F", "#364FC7"];
export const RESERVED_HANDLES = ["admin", "support", "help", "osmo", "pay", "request", "requests", "me", "home", "friends", "portfolio", "settings", "everyone", "welcome"];
export const HANDLE_RULE = /^[a-z0-9_]{3,20}$/;

export const PERSONAS: Person[] = [
  { handle: "charlie", first: "Charlie", last: "Sneed", color: "#1F4F82", photo: "/avatars/charlie.png", country: "US", address: "0x71C4a2E8b5d03F6c91e7B4A0d2c58e3F9A3f" },
  { handle: "taihl", first: "Taihl", last: "Le", color: "#0F9D8A", photo: "/avatars/taihl.png", country: "US" },
  { handle: "ana", first: "Ana", last: "Rivera", color: "#E8590C", photo: "/avatars/ana.png", country: "MX" },
  { handle: "wes", first: "Wes", last: "Kim", color: "#1971C2", photo: "/avatars/wes.png", country: "US" },
  { handle: "sabina", first: "Sabina", last: "Okafor", color: "#C2255C", photo: "/avatars/sabina.png", country: "NG" },
  { handle: "maya", first: "Maya", last: "Tran", color: "#2F9E44", photo: "/avatars/maya.png", country: "CA" },
  { handle: "jordan", first: "Jordan", last: "Park", color: "#B5651D", photo: "/avatars/jordan.png", country: "GB" },
  { handle: "dev", first: "Dev", last: "Mehta", color: "#D9480F", photo: "/avatars/dev.png", country: "IN" },
  { handle: "priya", first: "Priya", last: "Nair", color: "#0B7285", photo: "/avatars/priya.png", country: "SG" },
  { handle: "zoe", first: "Zoe", last: "Castillo", color: "#A61E4D", photo: "/avatars/zoe.png", country: "AR" },
];

/**
 * Character pictures anyone can pick instead of a photo: Noto emoji (Google, Apache 2.0 / OFL) on colourful
 * gradients, in /public/avatars/presets. Anyone without a photo gets one automatically, so every account has a picture.
 */
export const AVATAR_PRESETS: { id: string; label: string }[] = [
  { id: "fox", label: "Fox" },
  { id: "panda", label: "Panda" },
  { id: "frog", label: "Frog" },
  { id: "tiger", label: "Tiger" },
  { id: "unicorn", label: "Unicorn" },
  { id: "koala", label: "Koala" },
  { id: "monkey", label: "Monkey" },
  { id: "penguin", label: "Penguin" },
  { id: "octopus", label: "Octopus" },
  { id: "lion", label: "Lion" },
  { id: "alien", label: "Alien" },
  { id: "robot", label: "Robot" },
  { id: "ghost", label: "Ghost" },
  { id: "cool", label: "Cool" },
  { id: "rocket", label: "Rocket" },
  { id: "starstruck", label: "Star-struck" },
];

export function presetUrl(id: string): string {
  return `/avatars/presets/${id}.svg`;
}

/** The picture someone gets until they choose one: a character picked from their username, so it never changes. */
export function defaultAvatar(handle: string): string {
  let n = 0;
  for (const ch of handle) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return presetUrl(AVATAR_PRESETS[n % AVATAR_PRESETS.length].id);
}

export const HACKATHON_TAG = "UBC Hackathon 2026";

/**
 * UBC Hackathon 2026 participants, listed by Charlie with their permission. Real names, so: a character picture (no photos),
 * no made-up payments, and portfolios kept private. They show up in search, on Home and on Friends.
 */
export const HACKATHON_PEOPLE: Person[] = ([
  { handle: "bardia_ahmadi", first: "Bardia", last: "Ahmadi Dafchahi", color: "#1F4F82", tag: HACKATHON_TAG },
  { handle: "salem_alfassam", first: "Salem", last: "Alfassam", color: "#0F9D8A", tag: HACKATHON_TAG },
  { handle: "armon_behikeesh", first: "Armon", last: "Behikeesh", color: "#E8590C", tag: HACKATHON_TAG },
  { handle: "jack_bernstein", first: "Jack", last: "Bernstein-Sheehan", color: "#1971C2", tag: HACKATHON_TAG },
  { handle: "diego_carpenter", first: "Diego", last: "Carpenter", color: "#C2255C", tag: HACKATHON_TAG },
  { handle: "cameron_coleman", first: "Cameron", last: "Coleman", color: "#2F9E44", tag: HACKATHON_TAG },
  { handle: "armaan_hajarizadeh", first: "Armaan", last: "Hajarizadeh", color: "#D9480F", tag: HACKATHON_TAG },
  { handle: "audrey_hudspeth", first: "Audrey", last: "Hudspeth", color: "#364FC7", tag: HACKATHON_TAG },
  { handle: "banyan_julian", first: "Banyan", last: "Julian", color: "#5C7A99", tag: HACKATHON_TAG },
  { handle: "finian_kierstead", first: "Finian", last: "Kierstead", color: "#A61E4D", tag: HACKATHON_TAG },
  { handle: "nikita_klepikov", first: "Nikita", last: "Klepikov", color: "#0B7285", tag: HACKATHON_TAG },
  { handle: "ruhi_kotwal", first: "Ruhi", last: "Kotwal", color: "#B5651D", tag: HACKATHON_TAG },
  { handle: "kevin_le", first: "Kevin", last: "Le", color: "#1F4F82", tag: HACKATHON_TAG },
  { handle: "valentin_levy", first: "Valentin", last: "Levy", color: "#0F9D8A", tag: HACKATHON_TAG },
  { handle: "carsen_luna", first: "Carsen", last: "Luna", color: "#E8590C", tag: HACKATHON_TAG },
  { handle: "drew_manley", first: "Drew", last: "Manley", color: "#1971C2", tag: HACKATHON_TAG },
  { handle: "miles_miller", first: "Miles", last: "Miller", color: "#C2255C", tag: HACKATHON_TAG },
  { handle: "katrina_nguyen", first: "Katrina", last: "Nguyen", color: "#2F9E44", tag: HACKATHON_TAG },
  { handle: "mateusz_palusinski", first: "Mateusz", last: "Palusinski", color: "#D9480F", tag: HACKATHON_TAG },
  { handle: "braydon_perko", first: "Braydon", last: "Perko", color: "#364FC7", tag: HACKATHON_TAG },
  { handle: "chris_richardson", first: "Christopher", last: "Richardson", color: "#5C7A99", tag: HACKATHON_TAG },
  { handle: "nick_sakys", first: "Nick", last: "Sakys", color: "#A61E4D", tag: HACKATHON_TAG },
  { handle: "shaurya_saxena", first: "Shaurya", last: "Saxena", color: "#0B7285", tag: HACKATHON_TAG },
  { handle: "justin_schroeder", first: "Justin", last: "Schroeder", color: "#B5651D", tag: HACKATHON_TAG },
  { handle: "kellen_snider", first: "Kellen", last: "Snider", color: "#1F4F82", tag: HACKATHON_TAG },
  { handle: "blake_staats", first: "Blake", last: "Staats", color: "#0F9D8A", tag: HACKATHON_TAG },
  { handle: "eleanor_stenberg", first: "Eleanor", last: "Stenberg", color: "#E8590C", tag: HACKATHON_TAG },
  { handle: "matthew_stone", first: "Matthew", last: "Stone", color: "#1971C2", tag: HACKATHON_TAG },
  { handle: "fatima_syed", first: "Fatima", last: "Syed", color: "#C2255C", tag: HACKATHON_TAG },
  { handle: "evan_thompson", first: "Evan", last: "Thompson", color: "#2F9E44", tag: HACKATHON_TAG },
  { handle: "shantam_tyagi", first: "Shantam", last: "Tyagi", color: "#D9480F", tag: HACKATHON_TAG },
  { handle: "xavier_vortigern", first: "Xavier", last: "Vortigern", color: "#364FC7", tag: HACKATHON_TAG },
  { handle: "chris_warner", first: "Chris", last: "Warner", color: "#5C7A99", tag: HACKATHON_TAG },
  { handle: "archie_webber", first: "Archie", last: "Webber", color: "#A61E4D", tag: HACKATHON_TAG },
  { handle: "libby_wise", first: "Libby", last: "Wise", color: "#0B7285", tag: HACKATHON_TAG },
  { handle: "madeleine_ward", first: "Madeleine", last: "Ward", color: "#B5651D", tag: HACKATHON_TAG },
  { handle: "joseph_harris", first: "Joseph", last: "Harris", color: "#1F4F82", tag: HACKATHON_TAG },
  { handle: "huy_voqui", first: "Huy", last: "Voqui", color: "#0F9D8A", tag: HACKATHON_TAG },
  { handle: "liam_nichols", first: "Liam", last: "Nichols", color: "#E8590C", tag: HACKATHON_TAG },
  { handle: "joshua_mcmullen", first: "Joshua", last: "McMullen", color: "#1971C2", tag: HACKATHON_TAG },
  { handle: "lin_mills", first: "Lin", last: "Mills", color: "#C2255C", tag: HACKATHON_TAG },
  { handle: "calvin_peck", first: "Calvin", last: "N Peck Dobson", color: "#2F9E44", tag: HACKATHON_TAG },
  { handle: "anureet_waraich", first: "Anureet", last: "Waraich", color: "#D9480F", tag: HACKATHON_TAG },
  { handle: "shishir_thilavalli", first: "Shishir", last: "Thilavalli", color: "#364FC7", tag: HACKATHON_TAG },
  { handle: "clayton_fawthrop", first: "Clayton", last: "Fawthrop-Male", color: "#5C7A99", tag: HACKATHON_TAG },
  { handle: "jared_vaughn", first: "Jared", last: "Vaughn", color: "#A61E4D", tag: HACKATHON_TAG },
  { handle: "jalen_wang", first: "Jalen", last: "Wang", color: "#0B7285", tag: HACKATHON_TAG },
  { handle: "alana_nguyen", first: "Alana", last: "Nguyen", color: "#B5651D", tag: HACKATHON_TAG },
  { handle: "ritvik_botla", first: "Ritvik", last: "Botla", color: "#1F4F82", tag: HACKATHON_TAG },
  { handle: "parker_myers", first: "Parker", last: "Myers", color: "#0F9D8A", tag: HACKATHON_TAG },
] as Person[]).map((p) => ({ ...p, photo: defaultAvatar(p.handle) }));

export const PEOPLE: Person[] = [...PERSONAS, ...HACKATHON_PEOPLE];

export const MY_HOLDINGS: Record<string, number> = {
  USDC: 42.5,
  USDT: 20,
  NVDA: 0.31,
  SOL: 1.85,
  TSLA: 0.05,
  BTC: 0.0012,
  AAPL: 0.03,
  EURC: 12,
};

/** What a person shows of their portfolio on their profile. The wallet itself is always public on-chain; this controls the app. */
export interface PortfolioPrivacy {
  /** Master switch: show a portfolio section on my profile at all. */
  show: boolean;
  /** Who sees it. */
  who: "everyone" | "friends";
  /** The total value. */
  total: boolean;
  /** Which stocks and coins I hold. */
  holdings: boolean;
  /** How much of each: dollar values, share of the portfolio, or nothing. */
  amounts: "dollars" | "percent" | "hidden";
  /** Today's gain or loss. */
  performance: boolean;
  /** Which asset my public payments were sent in. */
  activity: boolean;
}

/** Portfolio hidden. Used for real people (hackathon participants) so no made-up holdings are shown under their names. */
export const PRIVATE_PRIVACY: PortfolioPrivacy = { show: false, who: "everyone", total: false, holdings: false, amounts: "hidden", performance: false, activity: false };

export const DEFAULT_PRIVACY: PortfolioPrivacy = { show: true, who: "everyone", total: false, holdings: true, amounts: "percent", performance: true, activity: true };

/** Sample portfolios for the other nine demo people, in token units. */
export const PEOPLE_HOLDINGS: Record<string, Record<string, number>> = {
  taihl: { ETH: 0.42, MON: 900, NVDA: 0.6, COIN: 0.25, USDC: 120 },
  ana: { AAPL: 0.4, NFLX: 0.08, PAXG: 0.012, PYUSD: 35 },
  wes: { TSLA: 0.35, BTC: 0.004, SOL: 3.2, USDC: 18 },
  sabina: { MSFT: 0.2, USDY: 150, EURC: 40 },
  maya: { META: 0.15, AMZN: 0.3, KAG: 1.5, USDC: 60 },
  jordan: { BTC: 0.01, ETH: 0.2, SOL: 6, USDT: 25 },
  dev: { NVDA: 1.1, GOOGL: 0.5, CRCL: 0.4, XAUT: 0.02, USDC: 75 },
  priya: { AAPL: 0.25, PAXG: 0.03, BUIDL: 200, USDC: 50 },
  zoe: { TSLA: 0.1, SOL: 1.2, MON: 400, DAI: 12 },
};

/** Each demo person's choices, picked so the demo shows every combination. */
export const PEOPLE_PRIVACY: Record<string, PortfolioPrivacy> = {
  taihl: { show: true, who: "everyone", total: true, holdings: true, amounts: "dollars", performance: true, activity: true },
  ana: { show: true, who: "everyone", total: false, holdings: true, amounts: "percent", performance: true, activity: true },
  wes: { show: true, who: "everyone", total: true, holdings: true, amounts: "hidden", performance: false, activity: true },
  sabina: { show: false, who: "everyone", total: false, holdings: false, amounts: "hidden", performance: false, activity: false },
  maya: { show: true, who: "friends", total: true, holdings: true, amounts: "dollars", performance: true, activity: true },
  jordan: { show: true, who: "everyone", total: true, holdings: false, amounts: "hidden", performance: true, activity: false },
  dev: { show: true, who: "everyone", total: true, holdings: true, amounts: "dollars", performance: true, activity: true },
  priya: { show: true, who: "everyone", total: false, holdings: true, amounts: "percent", performance: false, activity: true },
  zoe: { show: true, who: "everyone", total: false, holdings: true, amounts: "hidden", performance: true, activity: true },
};

export const FRIENDS: string[] = ["taihl", "ana", "wes", "sabina", "maya"];
export const INCOMING_FRIEND_REQUESTS: string[] = ["evan_thompson", "salem_alfassam", "cameron_coleman", "jordan"];

/** Who the other sample people are friends with, for the Friends feed and friends in common. */
export const OTHER_FRIENDSHIPS: [string, string][] = [
  ["ana", "wes"],
  ["sabina", "wes"],
  ["maya", "taihl"],
  ["dev", "priya"],
  ["priya", "zoe"],
  ["zoe", "jordan"],
  ["ana", "dev"],
];

export const PAYMENTS: Payment[] = [
  { ref: "p10", from: "sabina", to: "wes", usd: 34, note: "🍕 pizza and burgers", audience: "public", asset: "BTC", ago: 4, reactions: { "❤️": ["ana", "maya"], "😂": ["taihl"] }, comments: [{ id: "c1", by: "ana", text: "save me a slice", ago: 3 }], feeUsd: 0.004 },
  { ref: "p9", from: "taihl", to: "charlie", usd: 20, note: "☕ coffee run", audience: "public", asset: "NVDA", ago: 38, reactions: { "🙏": ["charlie"] }, comments: [], feeUsd: 0.005 },
  { ref: "p8", from: "charlie", to: "ana", usd: 48.5, note: "🎟️ Ducks tickets", audience: "public", asset: "NVDA", ago: 95, reactions: { "🔥": ["wes", "taihl", "maya"] }, comments: [{ id: "c2", by: "ana", text: "go ducks", ago: 90 }], feeUsd: 0.005 },
  { ref: "p7", from: "maya", to: "taihl", usd: 12, note: "🌮 taco tuesday", audience: "public", asset: "TSLA", ago: 160, reactions: { "😂": ["ana"] }, comments: [], feeUsd: 0.005 },
  { ref: "p6", from: "dev", to: "priya", usd: 60, note: "✈️ Lisbon hostel", audience: "public", asset: "USDC", ago: 240, reactions: { "✨": ["zoe"] }, comments: [], feeUsd: 0.006 },
  { ref: "p5", from: "wes", to: "charlie", usd: 15, note: "⛽ gas money", audience: "private", asset: "BTC", ago: 420, reactions: {}, comments: [], feeUsd: 0.005 },
  { ref: "p4", from: "priya", to: "zoe", usd: 25, note: "🎂 birthday dinner", audience: "public", asset: "ETH", ago: 600, reactions: { "❤️": ["dev"] }, comments: [], feeUsd: 0.005 },
  { ref: "p3", from: "charlie", to: "sabina", usd: 9, note: "🍻 last night", audience: "public", asset: "USDC", ago: 1500, reactions: { "😂": ["sabina"] }, comments: [], feeUsd: 0.004 },
  { ref: "p2", from: "ana", to: "maya", usd: 400, note: "🏠 rent", audience: "private", asset: "AAPL", ago: 2900, reactions: {}, comments: [], feeUsd: 0.005 },
  { ref: "p1", from: "zoe", to: "jordan", usd: 18, note: "🛒 groceries", audience: "public", asset: "SOL", ago: 4300, reactions: {}, comments: [], feeUsd: 0.004 },
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
  return `${p.first[0] ?? ""}${p.last[0] ?? p.first[1] ?? ""}`.toUpperCase();
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
  if (a.market === "treasuries") return symbol === "BUIDL" ? 0 : Math.abs(move) * 0.03; // interest builds up slowly
  if (a.market === "metals") return move * 0.5;
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
  const calm = symbol === "USDC" || symbol === "BUIDL";
  const rough = calm ? 0 : a.market === "treasuries" ? RANGES[range].rough * 0.03 : a.group === "cash" ? RANGES[range].rough * 0.1 : a.market === "metals" ? RANGES[range].rough * 0.5 : RANGES[range].rough;
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
