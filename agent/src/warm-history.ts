// Fill .cache/history.json before a demo, so restarting the agent costs one chunk
// instead of a 75-call scan this public RPC rate limits. Read-only, signs nothing.
import { createPublicClient } from "viem";
import { chain, transport } from "./act.ts";
import { readHistory } from "./history.ts";

const started = Date.now();
await readHistory(createPublicClient({ chain, transport }));
console.log(`took ${Math.round((Date.now() - started) / 1000)}s`);
