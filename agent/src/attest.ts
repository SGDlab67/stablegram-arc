// Read-only: re-derive today's agent spend from the Arc event log, then check it
// against the contract's own counter and the owner's cap. Sends nothing, signs
// nothing, opens no keystore and reads no key.
//
// The claim a judge can check here without trusting the agent: every dollar the
// agent moved today is in the log, the log adds up to exactly what the contract
// recorded, and the day stayed inside the cap the owner set.
import { createPublicClient, getAbiItem, type AbiEvent, type Address, type Hex, type PublicClient } from "viem";
import deployment from "../../deployments/arc-testnet.json" with { type: "json" };
import { ABI, STABLEPLAN, USDC, chain, transport } from "./act.ts";
import { OWNER, usd } from "./demo.ts";

const DAY = 86_400n; // the contract's day is block.timestamp / 1 days (Stableplan.sol, sendAsAgent)
const SPAN = 5_000n; // the Arc testnet RPC rejects a wider getLogs range
const DEPLOY_BLOCK = BigInt(deployment.deployBlock); // there is nothing to find below it
// Both event shapes come out of the deployment artifact, so they are the deployed ones.
const SENT = getAbiItem({ abi: ABI, name: "Sent" }) as AbiEvent;
const APPROVED = getAbiItem({ abi: ABI, name: "Approved" }) as AbiEvent;

type SentArgs = { token: Address; from: Address; to: Address; name: string; value: bigint; memo: string; byAgent: boolean };
export type Send = { block: bigint; to: Address; name: string; value: bigint; memo: string };
export type Counters = { perSend: bigint; perDay: bigint; counter: bigint; remaining: bigint };

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
export const sum = (sends: Send[]) => sends.reduce((t, s) => t + s.value, 0n);

// Why the log and the contract do not agree, empty when they do. Pure, so the
// arithmetic is tested with the chain reads left out (test/attest.test.ts).
export function problems(sends: Send[], c: Counters): string[] {
  const total = sum(sends);
  const p: string[] = [];
  for (const s of sends) if (s.value > c.perSend) p.push(`block ${s.block}: ${usd(s.value)} USDC is over the ${usd(c.perSend)} per-send cap`);
  if (total !== c.counter) p.push(`the log re-derives ${usd(total)} USDC, the contract counter holds ${usd(c.counter)}`);
  if (total > c.perDay) p.push(`${usd(total)} USDC is over the ${usd(c.perDay)} daily cap`);
  if (c.perDay - total !== c.remaining) p.push(`the cap minus the total is ${usd(c.perDay - total)} USDC, remainingToday says ${usd(c.remaining)}`);
  return p;
}

// The first block whose timestamp is already in the day starting at `start`.
// The RPC caps how wide a getLogs range may be, so the scan needs a tight lower
// bound rather than the deploy block.
async function firstBlockAt(pub: PublicClient, start: bigint, head: bigint): Promise<bigint> {
  let [lo, hi] = [DEPLOY_BLOCK, head];
  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    if ((await pub.getBlock({ blockNumber: mid })).timestamp < start) lo = mid + 1n;
    else hi = mid;
  }
  return lo;
}

async function main() {
  const pub = createPublicClient({ chain, transport });
  // getBlock, not getBlockNumber: this RPC's eth_blockNumber runs ahead of the
  // highest block it will actually serve, and it hands over the timestamp too.
  const head = await pub.getBlock();
  const today = head.timestamp / DAY;
  const dayStart = today * DAY;
  const from = await firstBlockAt(pub, dayStart, head.number);

  // Every Sent the contract emitted since the day began, in chunks the RPC
  // accepts. Approved rides along because approving a proposal also emits
  // Sent(byAgent: true) while leaving spentOf untouched: the owner sent that
  // one by hand, so it is not part of the agent's day and must not be counted.
  const logs: { args: unknown; blockNumber: bigint; transactionHash: Hex }[] = [];
  const approved = new Set<Hex>();
  for (let a = from; a <= head.number; a += SPAN) {
    const toBlock = a + SPAN - 1n > head.number ? head.number : a + SPAN - 1n;
    const [sent, ap] = await Promise.all([
      pub.getLogs({ address: STABLEPLAN, event: SENT, fromBlock: a, toBlock }),
      pub.getLogs({ address: STABLEPLAN, event: APPROVED, fromBlock: a, toBlock }),
    ]);
    logs.push(...sent);
    for (const l of ap) approved.add(l.transactionHash);
  }

  // What counts against today's cap: the owner's USDC, moved by the agent.
  const counted: Send[] = [];
  for (const l of logs) {
    const a = l.args as SentArgs;
    if (!a.byAgent || !same(a.token, USDC) || !same(a.from, OWNER) || approved.has(l.transactionHash)) continue;
    counted.push({ block: l.blockNumber, to: a.to, name: a.name, value: a.value, memo: a.memo });
  }
  // The day is the block's own timestamp, floored the way the contract floors
  // it. Everything scanned should already be inside it, so this also checks the
  // lower bound the scan started from.
  const stamps = new Map(await Promise.all([...new Set(counted.map((s) => s.block))].map(async (b) => [b, (await pub.getBlock({ blockNumber: b })).timestamp] as const)));
  const sends = counted.filter((s) => stamps.get(s.block)! / DAY === today);

  const read = (functionName: string) => pub.readContract({ address: STABLEPLAN, abi: ABI, functionName, args: [OWNER, USDC] });
  const [spent, limit, remaining] = (await Promise.all([read("spentOf"), read("limitOf"), read("remainingToday")])) as [[bigint, bigint], [bigint, bigint], bigint];
  const [spentDay, spentAmount] = spent;
  const [perSend, perDay] = limit;
  const counter = spentDay === today ? spentAmount : 0n; // a stale day is spent in a day that is over, so today it is zero
  const total = sum(sends);

  const line = (block: string, value: string, name: string, to: string, memo: string) => `  ${block.padEnd(11)} ${value.padStart(10)}  ${name.padEnd(18)} ${to.padEnd(44)} ${memo}`;
  const row = (label: string, value: bigint, note = "") => `  ${label.padEnd(26)} ${usd(value).padStart(10)} USDC  ${note}`.trimEnd();
  console.log(`Attestation on ${deployment.name}: today's agent spend, re-derived from the event log. Read-only, nothing was signed.\n`);
  console.log(`  contract    ${STABLEPLAN}`);
  console.log(`  owner       ${OWNER}`);
  console.log(`  token       ${USDC}  (USDC, 6 decimals)`);
  console.log(`  UTC day     ${today}  (from ${new Date(Number(dayStart) * 1000).toISOString()}, block.timestamp / 1 days)`);
  console.log(`  blocks      ${from} to ${head.number}  (the day opens in block ${from}, the contract was deployed in ${DEPLOY_BLOCK})\n`);
  console.log(line("block", "USDC", "recipient", "address", "memo"));
  for (const s of sends) console.log(line(String(s.block), usd(s.value), `@${s.name}`, s.to, s.memo));
  if (!sends.length) console.log("  (no agent send from the owner in this UTC day)");
  console.log(
    [
      "",
      row("re-derived from the log", total, `${sends.length} send${sends.length === 1 ? "" : "s"} counted`),
      row("contract counter", counter, spentDay === today ? `spentOf.day is ${spentDay}, today` : `spentOf.day is ${spentDay}, not today (${today}), so nothing is spent yet`),
      row("per-send cap", perSend),
      row("daily cap", perDay),
      row("remainingToday", remaining, `the cap minus the total is ${usd(perDay - total)}`),
      "",
    ].join("\n"),
  );

  const p = problems(sends, { perSend, perDay, counter, remaining });
  console.log(p.length ? `FAIL\n${p.map((x) => `  - ${x}`).join("\n")}` : "PASS: the log and the contract agree, and every send is inside both caps.");
  process.exitCode = p.length ? 1 : 0;
}

// Importing this module, as the test does, must not touch the chain.
if (import.meta.main) await main();
