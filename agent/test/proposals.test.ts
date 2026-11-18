import { test } from "node:test";
import assert from "node:assert/strict";
import { zeroAddress, type Address } from "viem";
import { readProposals } from "../src/server.ts";

const A = "0x00000000000000000000000000000000000000a1" as Address;
const TOKEN = "0x3600000000000000000000000000000000000000" as Address;
const SUPPLIER = "0x00000000000000000000000000000000000000b2" as Address;

// A chain stub: proposal 0 is open, 1 was approved (deleted, so a zero user), 2 is open.
function chain(count: bigint) {
  const rows: Record<string, unknown[]> = {
    "0": [A, TOKEN, SUPPLIER, 600_000_000n, "hillcountrymeats", "Food for 220 covers"],
    "1": [zeroAddress, zeroAddress, zeroAddress, 0n, "", ""],
    "2": [A, TOKEN, SUPPLIER, 5n, "hillcountrymeats", "again"],
  };
  return {
    readContract: async ({ functionName, args }: { functionName: string; args?: readonly unknown[] }) => {
      if (functionName === "proposalCount") return count;
      if (functionName === "proposals") return rows[String(args![0])];
      if (functionName === "nameOf") return args![0] === SUPPLIER ? "hillcountrymeats" : "";
      throw new Error(`unexpected read ${functionName}`);
    },
  } as never;
}

test("an empty chain gives an empty list", async () => {
  assert.deepEqual(await readProposals(chain(0n)), []);
});

test("deleted proposals are skipped and each recipient is resolved to its name", async () => {
  const open = await readProposals(chain(3n));
  assert.deepEqual(open.map((p) => p.id), [0n, 2n]);
  assert.equal(open[0].toName, "hillcountrymeats");
  assert.equal(open[0].value, 600_000_000n);
  assert.deepEqual(Object.keys(open[0]), ["id", "user", "token", "to", "toName", "value", "name", "memo"]);
});
