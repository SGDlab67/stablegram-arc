// The feed lives in memory, so until now a restart left the dashboard blank until
// the next Stream delivery, and everything the chain already recorded was invisible.
// This reads the contract's whole log once at boot so the page opens on the real
// testnet history, and the Stream only has to carry what happens from then on.
//
// Returns raw logs on purpose: server.ts feeds them to the same ingest() the webhook
// uses, so there is one decoder, one feed shape and one dedupe rule rather than two.
import { getAbiItem, type AbiEvent, type PublicClient } from "viem";
import deployment from "../../deployments/arc-testnet.json" with { type: "json" };
import { ABI, STABLEPLAN } from "./act.ts";

const SPAN = 5_000n; // the Arc testnet RPC rejects a wider getLogs range
const LANES = 8; // chunk requests in flight at once, to keep boot a few seconds not a minute
const EVENTS = ["Sent", "Proposed", "Approved", "Rejected"].map((name) => getAbiItem({ abi: ABI, name }) as AbiEvent);

export async function readHistory(pub: PublicClient) {
  // getBlock, not getBlockNumber: this RPC's eth_blockNumber runs ahead of the
  // highest block it will actually serve, so a range built from it comes back empty.
  const head = (await pub.getBlock()).number;
  const ranges: [bigint, bigint][] = [];
  for (let a = BigInt(deployment.deployBlock); a <= head; a += SPAN) ranges.push([a, a + SPAN - 1n > head ? head : a + SPAN - 1n]);

  const logs = [];
  for (let i = 0; i < ranges.length; i += LANES) {
    // One bad chunk must not lose the rest of the history, so a failure is an empty
    // chunk. It says so, because a silently dropped range is missing history that
    // nothing else would ever report.
    const batch = await Promise.all(
      ranges.slice(i, i + LANES).map(([fromBlock, toBlock]) =>
        pub.getLogs({ address: STABLEPLAN, events: EVENTS, fromBlock, toBlock }).catch((e) => {
          console.warn(`history: blocks ${fromBlock} to ${toBlock} failed, that range is missing from the feed: ${(e as Error).message}`);
          return [];
        }),
      ),
    );
    for (const chunk of batch) logs.push(...chunk);
  }

  // The Stream filter forwards blockTimestamp, so the backfill has to carry it too
  // or history from before this process started would have no time on it. One
  // getBlock per distinct block, not per log.
  const blocks = [...new Set(logs.map((l) => l.blockNumber))];
  const at = new Map(await Promise.all(blocks.map(async (b) => [b, (await pub.getBlock({ blockNumber: b! })).timestamp] as const)));
  return logs.map((l) => ({ ...l, blockTimestamp: Number(at.get(l.blockNumber)) }));
}
