// What the demo needs on chain, what is already true, and what is left to do. Shared by seed.ts and verify.ts.
// The decisions are pure (buildPlan, fundNeeded, problems) so they are tested with the chain reads stubbed.
import { createDecipheriv, scryptSync } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { concat, encodeFunctionData, formatUnits, isAddressEqual, keccak256, parseAbi, zeroAddress, type Abi, type Address, type Hex, type LocalAccount, type PublicClient } from "viem";
import { mnemonicToAccount, privateKeyToAccount, type HDAccount } from "viem/accounts";
import deployment from "../../deployments/arc-testnet.json" with { type: "json" };
import { ABI, STABLEPLAN, USDC, keychain } from "./act.ts";
import type { Venue } from "./forecast.ts";
import { loadVenue } from "./venue.ts";

export const REGISTRY = deployment.contracts.UsernameRegistry.address as Address;
export const REGISTRY_ABI = deployment.contracts.UsernameRegistry.abi as Abi;
const ERC20 = parseAbi(["function approve(address spender, uint256 value) returns (bool)", "function allowance(address owner, address spender) view returns (uint256)", "function balanceOf(address account) view returns (uint256)"]);

export const OWNER = deployment.deployer as Address;
export const OWNER_NAME = "longhorntaps";
export const PER_SEND = 30_000_000n; // $30: a $25 bonus pays straight through, the supplier deposit does not
export const PER_DAY = 150_000_000n;
export const DAY_USDC = 700_000_000n; // the day's plan: 4 bonuses of $25 and a supplier deposit of up to $600
// ponytail: flat gas budget for the agent's own sends (it cannot be simulated before it is authorized). Revisit if sendAsAgent gets dearer.
export const AGENT_TXS = 10n;
export const AGENT_TX_GAS = 300_000n;
const MARGIN_PCT = 125n; // on top of gas * maxFeePerGas, for a fee that moves between planning and sending
const MICRO = 10n ** 12n; // native is 18 decimals, the ERC-20 view of the same money is 6

export const usd = (micro: bigint) => formatUnits(micro, 6);
export const native = (wei: bigint) => usd(wei / MICRO); // the 6 decimal view, as the ERC-20 interface shows it
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// The owner's Foundry keystore (the same one script/with-deployer.sh unlocks), opened with the password from Keychain.
export async function ownerAccount(): Promise<LocalAccount> {
  const password = await keychain("arc-deployer-keystore");
  if (!password) throw new Error("live run needs Keychain item arc-deployer-keystore");
  const { crypto: c } = JSON.parse(await readFile(join(homedir(), ".foundry/keystores/arc-deployer"), "utf8"));
  const k = c.kdfparams;
  const dk = scryptSync(password, Buffer.from(k.salt, "hex"), k.dklen, { N: k.n, r: k.r, p: k.p, maxmem: 256 * k.n * k.r });
  const ct = Buffer.from(c.ciphertext, "hex");
  if (keccak256(concat([dk.subarray(16, 32), ct])) !== `0x${c.mac}`) throw new Error("wrong password for the arc-deployer keystore");
  const d = createDecipheriv("aes-128-ctr", dk.subarray(0, 16), Buffer.from(c.cipherparams.iv, "hex"));
  const account = privateKeyToAccount(`0x${Buffer.concat([d.update(ct), d.final()]).toString("hex")}`);
  if (!isAddressEqual(account.address, OWNER)) throw new Error(`keystore is ${account.address}, the deployer is ${OWNER}`);
  return account;
}

export type Demo = { name: string; username?: string; account: HDAccount };
export type Row = { name: string; address: Address; username?: string; native: bigint; has: string; holder: Address };
export type Snapshot = {
  rows: Row[]; // the agent first, then the demo accounts in venue-file order
  owner: { native: bigint; erc20: bigint; has: string; agent: Address; limit: readonly [bigint, bigint]; allowance: bigint };
  maxFee: bigint;
};
export type Gas = { transfer: bigint; claim: bigint; authorize: bigint; setLimit: bigint; approve: bigint };
export type Step = { from: string; label: string; to: Address; data?: Hex; value?: bigint; gas: bigint; skip?: string };

// One mnemonic, one account per address index, in this order: agent, the venue's staff, the supplier.
export function demoAccounts(mnemonic: string, venue: Venue): Demo[] {
  const names = ["agent", ...venue.staff.map((s) => s.username), venue.supplier];
  return names.map((name, i) => ({ name, username: i ? name : undefined, account: mnemonicToAccount(mnemonic, { addressIndex: i }) }));
}

// The mnemonic only ever lives in Keychain. When it is missing this prints the command to add it (no secret in the output) and exits.
export async function loadDemo() {
  const mnemonic = await keychain("stableplan-demo-mnemonic");
  if (!mnemonic) {
    console.log(`Keychain item stableplan-demo-mnemonic is missing. Nothing was done.

Add it with this command. -w with no value prompts for it, so it never lands in shell history or argv. Any BIP-39 mnemonic will do:

  security add-generic-password -a "$USER" -s stableplan-demo-mnemonic -w`);
    process.exit(1);
  }
  return demoAccounts(mnemonic, await loadVenue("austin-bar"));
}

export async function readSnapshot(pub: PublicClient, demo: Demo[]): Promise<Snapshot> {
  const sp = (functionName: string, args: unknown[]) => pub.readContract({ address: STABLEPLAN, abi: ABI, functionName, args });
  const reg = (functionName: string, args: unknown[]) => pub.readContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName, args }) as Promise<never>;
  const erc20 = (functionName: string, args: unknown[]) => pub.readContract({ address: USDC, abi: ERC20, functionName, args });
  const rows = await Promise.all(
    demo.map(async (d): Promise<Row> => {
      const address = d.account.address;
      const [bal, has, holder] = await Promise.all([pub.getBalance({ address }), reg("nameOf", [address]), d.username ? reg("resolve", [d.username]) : zeroAddress]);
      return { name: d.name, address, username: d.username, native: bal, has, holder };
    }),
  );
  const [ownerNative, ownerErc20, has, agent, limit, allowance, fees] = await Promise.all([
    pub.getBalance({ address: OWNER }),
    erc20("balanceOf", [OWNER]),
    reg("nameOf", [OWNER]),
    sp("agentOf", [OWNER]),
    sp("limitOf", [OWNER, USDC]),
    erc20("allowance", [OWNER, STABLEPLAN]),
    pub.estimateFeesPerGas(),
  ]);
  return {
    rows,
    owner: { native: ownerNative, erc20: ownerErc20 as bigint, has: has as string, agent: agent as Address, limit: limit as [bigint, bigint], allowance: allowance as bigint },
    maxFee: fees.maxFeePerGas!,
  };
}

// Gas for each kind of call, estimated on the live chain. The claim is estimated from the agent's address with a free 20 character name.
export async function estimateGas(pub: PublicClient, agent: Address): Promise<Gas> {
  const c = (address: Address, abi: Abi, functionName: string, args: unknown[], account: Address) => pub.estimateContractGas({ address, abi, functionName, args, account });
  const [transfer, claim, authorize, setLimit, approve] = await Promise.all([
    pub.estimateGas({ account: OWNER, to: agent, value: 1n }),
    c(REGISTRY, REGISTRY_ABI, "claim", ["z".repeat(20)], agent),
    c(STABLEPLAN, ABI, "authorizeAgent", [agent], OWNER),
    c(STABLEPLAN, ABI, "setLimit", [USDC, PER_SEND, PER_DAY], OWNER),
    c(USDC, ERC20 as Abi, "approve", [STABLEPLAN, DAY_USDC], OWNER),
  ]);
  return { transfer, claim, authorize, setLimit, approve };
}

// How much native USDC (wei) to send so `balance` covers `gas` at the live fee plus the margin, in whole micro-USDC. 0 when it already does.
export function fundNeeded(gas: bigint, maxFee: bigint, balance: bigint): bigint {
  const short = (gas * maxFee * MARGIN_PCT) / 100n - balance;
  return short > 0n ? ((short + MICRO - 1n) / MICRO) * MICRO : 0n;
}

export const agentBudget = (maxFee: bigint) => AGENT_TXS * AGENT_TX_GAS * maxFee;

// Everything the demo needs, in order, with what is already true marked `skip`. Throws on a name that cannot be had.
export function buildPlan(s: Snapshot, g: Gas): Step[] {
  const agent = s.rows[0];
  const claimed = new Set<string>();
  const need = (r: Row) => {
    if (!r.username) return AGENT_TXS * AGENT_TX_GAS; // the agent only sends
    if (r.holder !== zeroAddress && !isAddressEqual(r.holder, r.address)) throw new Error(`@${r.username} is already claimed by ${r.holder}, not ${r.name} (${r.address})`);
    if (r.has && !same(r.has, r.username)) throw new Error(`${r.name} (${r.address}) already holds @${r.has}, so it cannot claim @${r.username}`);
    if (r.holder !== zeroAddress) claimed.add(r.name);
    return claimed.has(r.name) ? 0n : g.claim;
  };
  const steps: Step[] = [];
  for (const r of s.rows) {
    const value = fundNeeded(need(r), s.maxFee, r.native);
    steps.push({ from: "owner", label: value ? `fund ${r.name} with ${native(value)} USDC` : `fund ${r.name}`, to: r.address, value, gas: g.transfer, skip: value ? undefined : "has enough" });
  }
  for (const r of s.rows) {
    if (!r.username) continue;
    steps.push({ from: r.name, label: `claim("${r.username}")`, to: REGISTRY, data: encodeFunctionData({ abi: REGISTRY_ABI, functionName: "claim", args: [r.username] }), gas: g.claim, skip: claimed.has(r.name) ? "already claimed" : undefined });
  }
  const limitSet = s.owner.limit[0] === PER_SEND && s.owner.limit[1] === PER_DAY;
  const sp = (functionName: string, args: unknown[]) => encodeFunctionData({ abi: ABI, functionName, args });
  steps.push(
    { from: "owner", label: `authorizeAgent(${agent.address})`, to: STABLEPLAN, data: sp("authorizeAgent", [agent.address]), gas: g.authorize, skip: isAddressEqual(s.owner.agent, agent.address) ? "already authorized" : undefined },
    { from: "owner", label: `setLimit(USDC, ${usd(PER_SEND)}, ${usd(PER_DAY)})`, to: STABLEPLAN, data: sp("setLimit", [USDC, PER_SEND, PER_DAY]), gas: g.setLimit, skip: limitSet ? "already set" : undefined },
    { from: "owner", label: `USDC.approve(Stableplan, ${usd(DAY_USDC)})`, to: USDC, data: encodeFunctionData({ abi: ERC20, functionName: "approve", args: [STABLEPLAN, DAY_USDC] }), gas: g.approve, skip: s.owner.allowance >= DAY_USDC ? "allowance already enough" : undefined },
  );
  return steps;
}

// What would be spent: gas fees at the max fee, and the native USDC moved to the demo accounts. The owner pays both its own fees and the funding.
export function totals(steps: Step[], maxFee: bigint) {
  const todo = steps.filter((x) => !x.skip);
  const fees = todo.reduce((t, x) => t + x.gas * maxFee, 0n);
  const funding = todo.reduce((t, x) => t + (x.value ?? 0n), 0n);
  const ownerOut = todo.filter((x) => x.from === "owner").reduce((t, x) => t + x.gas * maxFee + (x.value ?? 0n), 0n);
  return { count: todo.length, fees, funding, ownerOut };
}

// Why the demo is not ready, empty when it is.
export function problems(s: Snapshot): string[] {
  const p: string[] = [];
  if (!same(s.owner.has, OWNER_NAME)) p.push(`owner has no @${OWNER_NAME}`);
  for (const r of s.rows) if (r.username && !same(r.has, r.username)) p.push(`${r.name} has not claimed @${r.username}`);
  if (s.rows[0].native < agentBudget(s.maxFee)) p.push("agent has too little gas");
  if (!isAddressEqual(s.owner.agent, s.rows[0].address)) p.push("agent is not authorized");
  if (s.owner.limit[0] !== PER_SEND || s.owner.limit[1] !== PER_DAY) p.push("limit is not set");
  if (s.owner.allowance < DAY_USDC) p.push(`allowance is below ${usd(DAY_USDC)} USDC`);
  if (s.owner.erc20 < DAY_USDC) p.push(`owner holds ${usd(s.owner.erc20)} USDC, the day's plan needs ${usd(DAY_USDC)}`);
  return p;
}

export function table(s: Snapshot): string {
  const line = (a: string, b: string, c: string, d: string) => `  ${a.padEnd(18)} ${b.padEnd(44)} ${c.padEnd(18)} ${d}`;
  const out = [line("account", "address", "username", "native USDC"), line("owner", OWNER, s.owner.has && `@${s.owner.has}`, native(s.owner.native))];
  for (const r of s.rows) out.push(line(r.name, r.address, r.has && `@${r.has}`, native(r.native)));
  const agent = s.rows[0].address;
  out.push(
    "",
    `  owner USDC (ERC-20 view)  ${usd(s.owner.erc20)}  (native view ${native(s.owner.native)})`,
    `  agent authorized          ${isAddressEqual(s.owner.agent, agent) ? "yes" : s.owner.agent === zeroAddress ? "no" : `no, ${s.owner.agent}`}`,
    `  limit (per send / day)    ${usd(s.owner.limit[0])} / ${usd(s.owner.limit[1])} USDC`,
    `  allowance to Stableplan   ${usd(s.owner.allowance)} USDC`,
  );
  const p = problems(s);
  out.push("", p.length ? `NOT READY:\n${p.map((x) => `  - ${x}`).join("\n")}` : "DEMO READY");
  return out.join("\n");
}
