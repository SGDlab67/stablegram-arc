// A person paying a person, on the same contract the agent uses.
//
// There is no agent here and no cap: this is the sender's own authority over
// their own balance, which is why the daily budget does not apply and why
// `attest` does not count it. Same contract, same username lookup, same memo,
// same feed. The only thing that changes between the three shapes the product
// supports (person to person, business to person, business to business) is who
// holds the key and whether an agent was authorized to use it.
//
// On Arc the chain's own currency is USDC, so this uses sendNative: one
// transaction, and no allowance to set up first.
import { createPublicClient, createWalletClient, formatEther, parseEther, parseUnits } from "viem";
import { chain, transport, STABLEPLAN, ABI } from "./act.ts";
import { loadDemo } from "./demo.ts";

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  const v = i === -1 ? undefined : process.argv[i + 1];
  if (v === undefined && fallback === undefined) throw new Error(`missing --${name}`);
  return v ?? fallback!;
};

const from = arg("from", "maria");
const to = arg("to", "sam");
const usd = arg("usd", "3");
const memo = arg("memo", "Covered your section on Friday, thanks");
const live = process.argv.includes("--live");

const demo = await loadDemo();
const sender = demo.find((d) => d.name === from);
if (!sender) throw new Error(`no demo account named ${from}. Known: ${demo.map((d) => d.name).join(", ")}`);
if (!demo.some((d) => d.username === to)) throw new Error(`no demo username ${to}. Known: ${demo.map((d) => d.username).filter(Boolean).join(", ")}`);

// Native is 18 decimals on Arc, while the ERC-20 view of the same balance is 6.
const value = parseEther(usd);
const pub = createPublicClient({ chain, transport });
const balance = await pub.getBalance({ address: sender.account.address });

console.log(`Person to person on Arc testnet, through Stableplan.

  from      @${from}  ${sender.account.address}
  to        @${to}
  amount    ${usd} USDC  (${parseUnits(usd, 6)} base units in the ERC-20 view)
  memo      ${memo}
  balance   ${formatEther(balance)} USDC
  path      sendNative, the sender's own authority: no agent, no cap, no allowance
`);

if (balance < value) throw new Error(`@${from} holds ${formatEther(balance)} USDC, less than the ${usd} to send plus gas`);

const { request, result } = await pub.simulateContract({
  address: STABLEPLAN,
  abi: ABI,
  functionName: "sendNative",
  args: [to, memo],
  value,
  account: sender.account,
});
console.log(`simulation ok: @${to} resolves to ${result}`);

if (!live) {
  console.log("\nDry run: nothing was sent. Run with --live to send it.");
  process.exit(0);
}

const wallet = createWalletClient({ account: sender.account, chain, transport });
const hash = await wallet.writeContract(request);
const receipt = await pub.waitForTransactionReceipt({ hash });
console.log(`\n${receipt.status}  ${hash}`);
console.log(`https://explorer.testnet.arc.io/tx/${hash}`);
process.exitCode = receipt.status === "success" ? 0 : 1;
