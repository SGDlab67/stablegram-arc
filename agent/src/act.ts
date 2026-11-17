import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createPublicClient, createWalletClient, defineChain, formatUnits, http, parseAbi, type Abi, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import deployment from "../../deployments/arc-testnet.json" with { type: "json" };
import type { Payment, Plan } from "./forecast.ts";

export const USDC: Address = "0x3600000000000000000000000000000000000000";
export const STABLEGRAM = deployment.contracts.Stablegram.address as Address;

// propose and its events ship on another branch, so the fragment is declared here until the deployment json has them.
export const ABI = [
  ...(deployment.contracts.Stablegram.abi as Abi),
  ...parseAbi([
    "function propose(address user, address token, string name, uint256 value, string memo) returns (uint256)",
    "event Proposed(uint256 indexed id, address indexed user, address indexed to, address token, uint256 value, string memo)",
    "event Approved(uint256 indexed id)",
    "event Rejected(uint256 indexed id)",
  ]),
] as Abi;

const chain = defineChain({
  id: deployment.chainId,
  name: deployment.name,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: deployment.nativeDecimals },
  rpcUrls: { default: { http: [deployment.rpc] } },
});
const transport = http(deployment.rpc, { timeout: 10_000 });

// Secrets come from the macOS Keychain only: execFile, no shell, nothing on argv but the item name.
export async function keychain(service: string): Promise<string | undefined> {
  try {
    const { stdout } = await promisify(execFile)("security", ["find-generic-password", "-w", "-s", service]);
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

export type Result = { to: string; amount: string; fn: "sendAsAgent" | "propose"; call: string; simulation: string; hash?: string };

// Within both caps the agent pays directly; over either, it proposes and the owner decides.
export async function act(p: Plan, owner: Address, live: boolean): Promise<Result[]> {
  const pub = createPublicClient({ chain, transport });
  const read = (functionName: string, args: unknown[]) => pub.readContract({ address: STABLEGRAM, abi: ABI, functionName, args });
  const [perSend] = (await read("limitOf", [owner, USDC])) as [bigint, bigint];
  let remaining = (await read("remainingToday", [owner, USDC])) as bigint;
  const agent = (await read("agentOf", [owner])) as Address;

  const keyHex = await keychain("venue-agent-key");
  const account = keyHex ? privateKeyToAccount(keyHex as Hex) : undefined;
  if (live && !account) throw new Error("live run needs Keychain item venue-agent-key");
  if (live && account!.address.toLowerCase() !== agent.toLowerCase()) {
    throw new Error(`venue-agent-key is ${account!.address} but the owner's authorized agent is ${agent}`);
  }
  const wallet = account && createWalletClient({ account, chain, transport });

  const results: Result[] = [];
  for (const pay of [...p.payments, ...(p.supplier ? [p.supplier] : [])] as Payment[]) {
    const fn = pay.amount <= perSend && pay.amount <= remaining ? "sendAsAgent" : "propose";
    if (fn === "sendAsAgent") remaining -= pay.amount;
    const args = [owner, USDC, pay.username, pay.amount, pay.memo] as const;
    const r: Result = {
      to: pay.username,
      amount: formatUnits(pay.amount, 6),
      fn,
      call: `${fn}(${owner}, ${USDC}, "${pay.username}", ${pay.amount}, "${pay.memo}")`,
      simulation: "ok",
    };
    try {
      // Simulate from the authorized agent's address, so a dry run works without the key.
      const { request } = await pub.simulateContract({ address: STABLEGRAM, abi: ABI, functionName: fn, args, account: agent });
      if (live && wallet) {
        r.hash = await wallet.writeContract({ ...request, account });
        await pub.waitForTransactionReceipt({ hash: r.hash as Hex });
      }
    } catch (err) {
      r.simulation = `would revert: ${(err as Error).message.split("\n")[0]}`; // never sent
    }
    results.push(r);
  }
  return results;
}
