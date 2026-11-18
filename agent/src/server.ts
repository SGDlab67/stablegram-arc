import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { parseArgs } from "node:util";
import { createPublicClient, createWalletClient, decodeEventLog, encodeFunctionData, zeroAddress, type Address, type Hex, type PublicClient } from "viem";
import { ABI, STABLEPLAN, USDC, act, chain, keychain, route, transport } from "./act.ts";
import { REGISTRY, REGISTRY_ABI, ownerAccount } from "./demo.ts";
import { fetchEvents } from "./gemini.ts";
import { forecast, market, plan, relevantEvents, today, type Payment, type Plan } from "./forecast.ts";
import { loadVenue } from "./venue.ts";

const { values } = parseArgs({
  options: {
    live: { type: "boolean" },
    port: { type: "string", default: "8787" },
    origin: { type: "string", default: "http://localhost:3000" }, // the web app
    owner: { type: "string" }, // the venue owner's address, whose limits the agent spends against
  },
});

const streamToken = await keychain("quicknode-stream-token");
if (!streamToken) console.warn("Keychain item quicknode-stream-token is missing: /hooks/quicknode is closed until it is set.");
console.log(values.live ? "LIVE: POST /run sends transactions" : "dry run: POST /run sends nothing (start with --live to send)");

type FeedItem = { event: string; args: Record<string, string>; block: string; tx: string; logIndex: number };
export const feed: FeedItem[] = []; // ponytail: in memory, lost on restart; the Stream can backfill

const json = (res: ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(body, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
};

// The open proposals: approved and rejected ones are deleted on chain, which leaves a zero user.
export async function readProposals(pub: Pick<PublicClient, "readContract">) {
  const sp = (functionName: string, args: unknown[] = []) => pub.readContract({ address: STABLEPLAN, abi: ABI, functionName, args });
  const count = (await sp("proposalCount")) as bigint;
  const open = [];
  for (let id = 0n; id < count; id++) {
    const [user, token, to, value, name, memo] = (await sp("proposals", [id])) as [Address, Address, Address, bigint, string, string];
    if (user === zeroAddress) continue;
    const toName = (await pub.readContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "nameOf", args: [to] })) as string;
    open.push({ id, user, token, to, toName, value, name, memo });
  }
  return open;
}

// Demo shortcut: the server holds the owner's key. In production the owner signs in their own wallet.
let owner: ReturnType<typeof ownerAccount> | undefined;
async function decide(fn: "approve" | "reject", body: string) {
  const { id } = JSON.parse(body) as { id?: unknown };
  if (!/^\d+$/.test(String(id))) return { code: 400, body: { error: "send {id} as a whole number" } };
  const pub = createPublicClient({ chain, transport });
  const data = encodeFunctionData({ abi: ABI, functionName: fn, args: [BigInt(String(id))] });
  try {
    await pub.call({ account: values.owner as Address, to: STABLEPLAN, data }); // reverts here, before anything is sent
  } catch (err) {
    return { code: 409, body: { error: `would revert: ${(err as Error).message.split("\n")[0]}` } };
  }
  if (!values.live) return { code: 200, body: { live: false, hash: null, status: "simulated ok, nothing sent (start with --live to send)" } };
  const account = await (owner ??= ownerAccount().catch((e) => ((owner = undefined), Promise.reject(e)))); // the key is opened only to send
  if (account.address.toLowerCase() !== String(values.owner).toLowerCase()) throw new Error(`the keystore is ${account.address}, not --owner ${values.owner}`);
  const hash = await createWalletClient({ account, chain, transport }).sendTransaction({ to: STABLEPLAN, data });
  const { status } = await pub.waitForTransactionReceipt({ hash });
  return { code: 200, body: { live: true, hash, status } };
}

const readBody = async (req: IncomingMessage) => {
  let n = 0;
  const chunks: Buffer[] = [];
  for await (const c of req) {
    if ((n += c.length) > 5e6) throw new Error("body too large");
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const sameToken = (given: string | undefined) => {
  const a = Buffer.from(given ?? "");
  const b = Buffer.from(streamToken ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
};

async function build(q: URLSearchParams) {
  const venue = await loadVenue(q.get("venue") ?? "austin-bar");
  const day = q.get("day") ?? today(venue.timezone);
  const { events, source } = await fetchEvents(venue);
  const f = forecast(venue, day, events);
  return { venue, source, markets: relevantEvents(events, venue, day).map((e) => market(e, venue)), forecast: f, plan: plan(venue, f) };
}

// Tag each payment with how the agent will make it, so the dashboard can say "agent pays" or "needs approval" before Run.
// Unknown (no owner, or the chain is unreachable) leaves fn out rather than guessing.
async function withRoutes<T extends { plan: Plan }>(b: T) {
  if (!values.owner) return b;
  try {
    const pub = createPublicClient({ chain, transport });
    const read = (functionName: string) => pub.readContract({ address: STABLEPLAN, abi: ABI, functionName, args: [values.owner as Address, USDC] });
    const [perSend] = (await read("limitOf")) as [bigint, bigint];
    let remaining = (await read("remainingToday")) as bigint;
    const tag = (p: Payment) => {
      const fn = route(p.amount, perSend, remaining);
      if (fn === "sendAsAgent") remaining -= p.amount;
      return { ...p, fn };
    };
    const { payments, supplier } = b.plan;
    return { ...b, plan: { ...b.plan, payments: payments.map(tag), supplier: supplier && tag(supplier) } };
  } catch {
    return b;
  }
}

// Logs may arrive as an array, {data: [...]} or nested per block; decode what is ours and skip the rest.
export function ingest(body: unknown) {
  const raw = (body as { data?: unknown })?.data ?? body;
  let added = 0;
  for (const log of [raw].flat(Infinity) as { address?: string; topics?: Hex[]; data?: Hex; blockNumber?: string; transactionHash?: string; logIndex?: string | number }[]) {
    if (log?.address?.toLowerCase() !== STABLEPLAN.toLowerCase() || !log.topics) continue;
    try {
      const { eventName, args } = decodeEventLog({ abi: ABI, data: log.data ?? "0x", topics: log.topics as [Hex, ...Hex[]] }) as { eventName: string; args: Record<string, unknown> };
      if (!["Sent", "Proposed", "Approved", "Rejected"].includes(eventName)) continue;
      const item: FeedItem = {
        event: eventName,
        args: Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)])),
        block: String(Number(log.blockNumber ?? 0)),
        tx: log.transactionHash ?? "",
        logIndex: Number(log.logIndex ?? 0),
      };
      if (feed.some((x) => x.tx === item.tx && x.logIndex === item.logIndex)) continue; // the Stream may redeliver
      feed.unshift(item);
      added++;
    } catch {} // not one of ours
  }
  feed.length = Math.min(feed.length, 500);
  return added;
}

// A browser always sends Origin on cross-site posts: refuse any page that is not the web app.
const allowed = (origin: string | undefined) => !origin || origin === values.origin;

export const handler = async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", "http://x");
  const origin = req.headers.origin;
  if (origin === values.origin) res.setHeader("access-control-allow-origin", origin);
  res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
  try {
    if (req.method === "OPTIONS") return void res.writeHead(204).end();
    if (req.method === "GET" && url.pathname === "/plan") return json(res, 200, await withRoutes(await build(url.searchParams)));
    if (req.method === "GET" && url.pathname === "/feed") return json(res, 200, feed);
    if (req.method === "GET" && url.pathname === "/proposals") return json(res, 200, await readProposals(createPublicClient({ chain, transport })));
    if (req.method === "POST" && (url.pathname === "/approve" || url.pathname === "/reject")) {
      if (!allowed(origin)) return json(res, 403, { error: "bad origin" });
      if (!values.owner) return json(res, 500, { error: "start the server with --owner 0x..." });
      const r = await decide(url.pathname === "/approve" ? "approve" : "reject", await readBody(req));
      return json(res, r.code, r.body);
    }
    if (req.method === "POST" && url.pathname === "/run") {
      if (!allowed(origin)) return json(res, 403, { error: "bad origin" });
      if (!values.owner) return json(res, 500, { error: "start the server with --owner 0x..." });
      const { plan: p } = await build(url.searchParams);
      return json(res, 200, { live: !!values.live, results: await act(p, values.owner as Address, !!values.live) });
    }
    if (req.method === "POST" && url.pathname === "/hooks/quicknode") {
      const auth = req.headers.authorization?.replace(/^Bearer /, "") ?? (req.headers["x-qn-token"] as string | undefined);
      // Fail closed. This endpoint is the one thing a tunnel exposes to the
      // internet, so an unconfigured token refuses rather than trusts.
      if (!streamToken) return json(res, 503, { error: "webhook not configured: set Keychain item quicknode-stream-token" });
      if (!sameToken(auth)) return json(res, 401, { error: "bad token" });
      return json(res, 200, { added: ingest(JSON.parse(await readBody(req))) });
    }
    json(res, 404, { error: "not found" });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: (err as Error).message });
  }
};

// Importing this module, as the tests do, must not open a port.
if (import.meta.main) createServer(handler).listen(Number(values.port), "127.0.0.1", () => console.log(`agent on http://127.0.0.1:${values.port}`));
