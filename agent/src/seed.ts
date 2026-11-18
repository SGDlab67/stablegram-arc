import { createDecipheriv, scryptSync } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { bytesToHex, concat, createPublicClient, createWalletClient, isAddressEqual, keccak256, type Hex, type LocalAccount } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import deployment from "../../deployments/arc-testnet.json" with { type: "json" };
import { chain, keychain, transport } from "./act.ts";
import { OWNER, buildPlan, estimateGas, loadDemo, native, readSnapshot, table, totals, type Demo } from "./demo.ts";

const { values } = parseArgs({ options: { "dry-run": { type: "boolean" }, live: { type: "boolean" } }, allowPositionals: false });
if (values.live && values["dry-run"]) throw new Error("pick one of --dry-run and --live");
const live = !!values.live;

// The owner's Foundry keystore (the same one script/with-deployer.sh unlocks), opened with the password from Keychain.
async function ownerAccount(): Promise<LocalAccount> {
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

// act.ts reads the agent's key from Keychain item venue-agent-key. It goes in through `security -i` on stdin: not argv, not shell history.
async function agentKeySet(agent: Demo): Promise<boolean> {
  const have = await keychain("venue-agent-key");
  if (!have) return false;
  const addr = privateKeyToAccount((have.startsWith("0x") ? have : `0x${have}`) as Hex).address;
  if (!isAddressEqual(addr, agent.account.address)) throw new Error(`Keychain item venue-agent-key is ${addr}, not the demo agent ${agent.account.address}. Delete it or fix it, this will not overwrite it.`);
  return true;
}

async function storeAgentKey(agent: Demo) {
  const key = bytesToHex(agent.account.getHdKey().privateKey!);
  const p = spawn("security", ["-i"], { stdio: ["pipe", "ignore", "inherit"] });
  p.stdin.end(`add-generic-password -a venue-agent -s venue-agent-key -w ${key}\n`);
  const code = await new Promise((done) => p.on("close", done));
  if (code !== 0 || !(await keychain("venue-agent-key"))) throw new Error("could not store venue-agent-key in Keychain");
  console.log(" 0. stored venue-agent-key in Keychain");
}

const demo = await loadDemo();
const pub = createPublicClient({ chain, transport });
if ((await pub.getChainId()) !== deployment.chainId) throw new Error("rpc is not Arc testnet");
const snap = await readSnapshot(pub, demo);
const steps = buildPlan(snap, await estimateGas(pub, demo[0].account.address));
const keySet = await agentKeySet(demo[0]);
const t = totals(steps, snap.maxFee);
if (t.ownerOut > snap.owner.native) throw new Error(`owner needs ${native(t.ownerOut)} USDC for this plan and holds ${native(snap.owner.native)}`);

console.log(`Seed plan (${live ? "live" : "dry run"}) on ${deployment.name}, max fee ${snap.maxFee / 1_000_000_000n} gwei, costs are gas at the max fee, in USDC\n`);
console.log(` 0. ${"local".padEnd(18)} ${"store the agent key in Keychain item venue-agent-key".padEnd(70)} ${keySet ? "skip: already set" : "todo"}`);
steps.forEach((x, i) => console.log(`${String(i + 1).padStart(2)}. ${x.from.padEnd(18)} ${x.label.padEnd(70)} ${native(x.gas * snap.maxFee).padStart(9)}  ${x.skip ? `skip: ${x.skip}` : "todo"}`));
console.log(`\nTo do: ${t.count} transactions. Gas fees ${native(t.fees)} USDC, plus ${native(t.funding)} USDC moved to the demo accounts for their own gas.`);
console.log(`Owner spends ${native(t.ownerOut)} of its ${native(snap.owner.native)} USDC.`);

if (live) {
  if (!keySet) await storeAgentKey(demo[0]);
  const signer = new Map<string, LocalAccount>([["owner", await ownerAccount()], ...demo.map((d) => [d.name, d.account] as const)]);
  for (const [i, x] of steps.entries()) {
    if (x.skip) continue;
    const account = signer.get(x.from)!;
    await pub.call({ account, to: x.to, data: x.data, value: x.value }); // reverts here, before anything is sent
    const hash = await createWalletClient({ account, chain, transport }).sendTransaction({ to: x.to, data: x.data, value: x.value });
    const receipt = await pub.waitForTransactionReceipt({ hash });
    console.log(`${String(i + 1).padStart(2)}. ${receipt.status} ${hash}`);
    if (receipt.status !== "success") throw new Error(`step ${i + 1} failed: ${x.label}`);
  }
} else {
  console.log("\nDry run: nothing was sent. Run with --live to do it.");
}
console.log(`\nReadiness${live ? "" : " (the chain as it is now)"}\n${table(live ? await readSnapshot(pub, demo) : snap)}`);
