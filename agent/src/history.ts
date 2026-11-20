// The feed lives in memory, so without this a restart left the dashboard blank until
// the next Stream delivery and everything the chain had already recorded was invisible.
//
// Scanning the whole contract from its deploy block costs about 75 getLogs calls, which
// this public RPC rate limits if you do it on every boot. So the result is cached on
// disk and a restart only scans the blocks since the last run, which is usually one
// chunk. That matters on demo day: restarting the agent should not cost a minute of
// backoff, or risk a 429 taking the plan and the readiness check down with it.
//
// Returns raw log shapes on purpose: server.ts feeds them to the same ingest() the
// webhook uses, so there is one decoder, one feed shape and one dedupe rule.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { getAbiItem, type AbiEvent, type PublicClient } from "viem";
import deployment from "../../deployments/arc-testnet.json" with { type: "json" };
import { ABI, STABLEPLAN } from "./act.ts";

const SPAN = 5_000n; // the Arc testnet RPC rejects a wider getLogs range
const LANES = 3; // chunk requests in flight at once. 8 gets this RPC to answer 429.
const PACE = 700; // ms between batches, so a cold scan does not trip the rate limit
const TRIES = 4; // a rate-limited chunk is retried, because a dropped one is missing history
const DEPLOY = BigInt(deployment.deployBlock);
const CACHE_DIR = new URL("../.cache/", import.meta.url);
const CACHE = new URL("history.json", CACHE_DIR);
const EVENTS = ["Sent", "Proposed", "Approved", "Rejected"].map((name) => getAbiItem({ abi: ABI, name }) as AbiEvent);

/** Exactly what ingest() reads, and all of it JSON-safe so the cache needs no bigint handling. */
type RawLog = { address: string; topics: string[]; data: string; blockNumber: string; transactionHash: string; logIndex: number; blockTimestamp: number };
type Cache = { toBlock: string; logs: RawLog[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function load(): Promise<Cache> {
  try {
    const c = JSON.parse(await readFile(CACHE, "utf8")) as Cache;
    return Array.isArray(c?.logs) && typeof c.toBlock === "string" ? c : { toBlock: "0", logs: [] };
  } catch {
    return { toBlock: "0", logs: [] }; // no cache yet, or it is unreadable: scan from the deploy block
  }
}

/** One range, retried through the RPC's rate limit. `ok` is false when it gave up. */
async function chunk(pub: PublicClient, fromBlock: bigint, toBlock: bigint) {
  for (let attempt = 0; ; attempt++) {
    try {
      return { ok: true, logs: await pub.getLogs({ address: STABLEPLAN, events: EVENTS, fromBlock, toBlock }) };
    } catch (e) {
      if (attempt + 1 >= TRIES) {
        console.warn(`history: blocks ${fromBlock} to ${toBlock} failed ${TRIES} times, that range is missing from the feed: ${(e as Error).message.split("\n")[0]}`);
        return { ok: false, logs: [] };
      }
      await sleep(400 * 2 ** attempt); // 400ms, 800ms, 1600ms
    }
  }
}

export async function readHistory(pub: PublicClient): Promise<RawLog[]> {
  // getBlock, not getBlockNumber: this RPC's eth_blockNumber runs ahead of the highest
  // block it will actually serve, so a range built from it comes back empty.
  const head = (await pub.getBlock()).number;
  const cached = await load();
  const cachedTo = BigInt(cached.toBlock);
  const from = cached.logs.length && cachedTo >= DEPLOY ? cachedTo + 1n : DEPLOY;

  const ranges: [bigint, bigint][] = [];
  for (let a = from; a <= head; a += SPAN) ranges.push([a, a + SPAN - 1n > head ? head : a + SPAN - 1n]);

  let complete = true;
  const found = [];
  for (let i = 0; i < ranges.length; i += LANES) {
    // Paced on purpose. A full scan from the deploy block is about 75 calls and this
    // public RPC rate limits a burst of them, which then takes the plan and the
    // readiness check down with it. A seeded cache makes this path rare anyway.
    if (i) await sleep(PACE);
    const batch = await Promise.all(ranges.slice(i, i + LANES).map(([a, b]) => chunk(pub, a, b)));
    for (const r of batch) {
      if (!r.ok) complete = false;
      found.push(...r.logs);
    }
  }

  // The Stream filter forwards blockTimestamp, so the backfill carries it too or history
  // from before this process started would have no time on it. One getBlock per distinct
  // block, not per log.
  const blocks = [...new Set(found.map((l) => l.blockNumber))];
  const at = new Map(await Promise.all(blocks.map(async (b) => [b, Number((await pub.getBlock({ blockNumber: b! })).timestamp)] as const)));
  const fresh: RawLog[] = found.map((l) => ({
    address: l.address,
    topics: l.topics as string[],
    data: l.data,
    blockNumber: String(l.blockNumber),
    transactionHash: l.transactionHash!,
    logIndex: l.logIndex!,
    blockTimestamp: at.get(l.blockNumber) ?? 0,
  }));

  const logs = [...cached.logs, ...fresh];
  // Only persist when every range answered. Writing a scan that lost a chunk would bake
  // that hole in permanently, because the next run starts after it and never looks back.
  if (complete) {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(CACHE, JSON.stringify({ toBlock: String(head), logs } satisfies Cache));
  }
  console.log(`history: ${logs.length} events (${fresh.length} new, scanned ${ranges.length} ranges from block ${from})${complete ? "" : ", incomplete so not cached"}`);
  return logs;
}
