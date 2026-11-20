// The attestation arithmetic, with the chain reads left out.
import test from "node:test";
import assert from "node:assert/strict";
import { problems, sum, type Send } from "../src/attest.ts";

const PER_SEND = 30_000_000n; // $30
const PER_DAY = 150_000_000n; // $150
const send = (block: bigint, value: bigint): Send => ({ block, to: "0x0000000000000000000000000000000000000001", name: "maria", value, memo: "bonus" });

test("a day the contract agrees with has nothing to report", () => {
  const sends = [send(1n, 25_000_000n), send(2n, 20_000_000n)];
  assert.equal(sum(sends), 45_000_000n);
  assert.deepEqual(problems(sends, { perSend: PER_SEND, perDay: PER_DAY, counter: 45_000_000n, remaining: PER_DAY - 45_000_000n }), []);
});

test("an empty day passes only against a zero counter and the full cap", () => {
  assert.deepEqual(problems([], { perSend: PER_SEND, perDay: PER_DAY, counter: 0n, remaining: PER_DAY }), []);
  assert.equal(problems([], { perSend: PER_SEND, perDay: PER_DAY, counter: 1n, remaining: PER_DAY }).length, 1);
  assert.equal(problems([], { perSend: PER_SEND, perDay: PER_DAY, counter: 0n, remaining: 0n }).length, 1);
});

test("every kind of mismatch is named on its own line", () => {
  const p = problems([send(1n, 40_000_000n)], { perSend: PER_SEND, perDay: 30_000_000n, counter: 39_000_000n, remaining: 0n });
  assert.equal(p.length, 4); // over the per-send cap, counter mismatch, over the daily cap, remainingToday mismatch
  assert.match(p[0], /per-send cap/);
  assert.match(p[1], /contract counter/);
});
