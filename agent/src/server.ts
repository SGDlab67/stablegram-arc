import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { parseArgs } from "node:util";
import { decodeEventLog, type Address, type Hex } from "viem";
import { ABI, STABLEPLAN, act, keychain } from "./act.ts";
import { fetchEvents } from "./gemini.ts";
import { forecast, market, plan, relevantEvents, today } from "./forecast.ts";
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
const feed: FeedItem[] = []; // ponytail: in memory, lost on restart; the Stream can backfill

const json = (res: ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(body, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
};

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

// Logs may arrive as an array, {data: [...]} or nested per block; decode what is ours and skip the rest.
function ingest(body: unknown) {
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

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  const origin = req.headers.origin;
  if (origin === values.origin) res.setHeader("access-control-allow-origin", origin);
  res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
  try {
    if (req.method === "OPTIONS") return void res.writeHead(204).end();
    if (req.method === "GET" && url.pathname === "/plan") return json(res, 200, await build(url.searchParams));
    if (req.method === "GET" && url.pathname === "/feed") return json(res, 200, feed);
    if (req.method === "POST" && url.pathname === "/run") {
      // A browser always sends Origin on cross-site posts: refuse any page that is not the web app.
      if (origin && origin !== values.origin) return json(res, 403, { error: "bad origin" });
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
}).listen(Number(values.port), "127.0.0.1", () => console.log(`agent on http://127.0.0.1:${values.port}`));
