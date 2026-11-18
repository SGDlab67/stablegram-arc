// Create the demo mnemonic that seed.ts derives the agent, the staff and the
// supplier from.
//
//   npm run init-mnemonic
//
// The phrase is generated in this process and handed to the Keychain through
// `security -i` on stdin. It is never printed, never written to a file and
// never put on argv or in shell history. Nothing reads it back out except
// seed.ts and verify.ts, through the Keychain.
//
// This is a throwaway testnet identity. Never point it at a phrase that guards
// real funds.
import { spawn } from "node:child_process";
import { generateMnemonic, english } from "viem/accounts";
import { keychain } from "./act.ts";

const ITEM = "stableplan-demo-mnemonic";

if (await keychain(ITEM)) {
  console.log(`Keychain item ${ITEM} already exists, so nothing was changed.`);
  console.log(`To replace it: security delete-generic-password -s ${ITEM}, then run this again.`);
  process.exit(0);
}

const store = spawn("security", ["-i"], { stdio: ["pipe", "ignore", "inherit"] });
store.stdin.end(`add-generic-password -a "${process.env.USER}" -s ${ITEM} -w ${generateMnemonic(english)}\n`);

const code = await new Promise<number>((done) => store.on("close", (c) => done(c ?? 1)));
if (code !== 0 || !(await keychain(ITEM))) {
  console.error(`could not store ${ITEM} in the Keychain (security exited ${code})`);
  process.exit(1);
}
console.log(`Stored a new 12 word mnemonic in Keychain item ${ITEM}. It was not printed anywhere.`);
console.log("Next: npm run verify");
