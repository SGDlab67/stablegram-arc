// Read-only: the readiness table, run before recording the demo. Sends nothing.
import { createPublicClient } from "viem";
import { chain, transport } from "./act.ts";
import { loadDemo, problems, readSnapshot, table } from "./demo.ts";

const snap = await readSnapshot(createPublicClient({ chain, transport }), await loadDemo());
console.log(table(snap));
process.exitCode = problems(snap).length ? 1 : 0;
