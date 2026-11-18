import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { zeroAddress } from "viem";
import { AGENT_TXS, AGENT_TX_GAS, DAY_USDC, OWNER, PER_DAY, PER_SEND, agentBudget, buildPlan, demoAccounts, fundNeeded, problems, totals, type Gas, type Snapshot } from "../src/demo.ts";
import type { Venue } from "../src/forecast.ts";

const venue: Venue = JSON.parse(readFileSync(new URL("../venues/austin-bar.json", import.meta.url), "utf8"));
const MNEMONIC = "test test test test test test test test test test test junk"; // the public Foundry test mnemonic
const demo = demoAccounts(MNEMONIC, venue);
const gas: Gas = { transfer: 21_000n, claim: 75_000n, authorize: 46_000n, setLimit: 47_000n, approve: 56_000n };
const maxFee = 29_000_000_000n;
const ETH = 10n ** 18n;

// A chain where nothing has been done yet.
function fresh(): Snapshot {
  return {
    rows: demo.map((d) => ({ name: d.name, address: d.account.address, username: d.username, native: 0n, has: "", holder: zeroAddress })),
    owner: { native: 39n * ETH, erc20: 39_000_000n, has: "longhorntaps", agent: zeroAddress, limit: [0n, 0n], allowance: 0n },
    maxFee,
  };
}

// The same chain after a full seed.
function seeded(): Snapshot {
  const s = fresh();
  for (const r of s.rows) {
    r.native = r.username ? 0n : fundNeeded(AGENT_TXS * AGENT_TX_GAS, maxFee, 0n); // what the plan sends the agent
    if (r.username) [r.has, r.holder] = [r.username, r.address];
  }
  s.owner = { ...s.owner, erc20: DAY_USDC, agent: s.rows[0].address, limit: [PER_SEND, PER_DAY], allowance: DAY_USDC };
  return s;
}

test("accounts are deterministic: agent, staff in venue order, then the supplier", () => {
  assert.deepEqual(demo.map((d) => d.name), ["agent", "maria", "dev", "sam", "lee", "hillcountrymeats"]);
  assert.equal(demo[0].username, undefined);
  assert.equal(demo[0].account.address, demoAccounts(MNEMONIC, venue)[0].account.address);
  assert.equal(new Set(demo.map((d) => d.account.address)).size, 6);
  assert.equal(demo[0].account.address, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // index 0 of the test mnemonic
});

test("fundNeeded covers gas plus margin, rounds up to a micro-USDC, and is 0 when funded", () => {
  const need = (75_000n * maxFee * 125n) / 100n;
  const top = fundNeeded(75_000n, maxFee, 0n);
  assert.ok(top >= need && top < need + 10n ** 12n);
  assert.equal(top % 10n ** 12n, 0n);
  assert.equal(fundNeeded(75_000n, maxFee, top), 0n);
  assert.equal(fundNeeded(75_000n, maxFee, need + 1n), 0n);
  assert.equal(fundNeeded(0n, maxFee, 0n), 0n);
  const part = fundNeeded(75_000n, maxFee, top / 2n); // only the shortfall is sent
  assert.ok(part > 0n && part < top);
});

test("a fresh chain needs every step: 6 fundings, 5 claims, authorize, limit, approve", () => {
  const steps = buildPlan(fresh(), gas);
  assert.equal(steps.length, 6 + 5 + 3);
  assert.deepEqual(steps.filter((x) => x.skip), []);
  const t = totals(steps, maxFee);
  assert.equal(t.count, 14);
  assert.equal(t.funding, steps.reduce((n, x) => n + (x.value ?? 0n), 0n));
  assert.equal(t.fees, steps.reduce((n, x) => n + x.gas * maxFee, 0n));
  const agentFund = steps[0].value!;
  assert.ok(agentFund >= agentBudget(maxFee)); // the agent is funded for its sends, not for a claim
  assert.ok(problems(fresh()).length >= 6);
});

test("re-running a seeded chain skips everything", () => {
  const steps = buildPlan(seeded(), gas);
  assert.equal(steps.length, 14);
  assert.deepEqual(steps.filter((x) => !x.skip), []);
  assert.equal(totals(steps, maxFee).count, 0);
  assert.deepEqual(problems(seeded()), []);
});

test("only what is missing is done", () => {
  const s = seeded();
  s.rows[2].has = ""; // dev unclaimed
  s.rows[2].holder = zeroAddress;
  s.rows[2].native = 0n;
  s.owner.allowance = DAY_USDC - 1n;
  s.owner.limit = [PER_SEND, 1n];
  const todo = buildPlan(s, gas).filter((x) => !x.skip).map((x) => x.label);
  assert.equal(todo.length, 4);
  assert.match(todo[0], /^fund dev/);
  assert.equal(todo[1], 'claim("dev")');
  assert.match(todo[2], /^setLimit/);
  assert.match(todo[3], /^USDC\.approve/);
});

test("a name held by another address, or a second name for one address, stops the plan", () => {
  const taken = fresh();
  taken.rows[1].holder = "0x000000000000000000000000000000000000dEaD";
  assert.throws(() => buildPlan(taken, gas), /@maria is already claimed by 0x000000000000000000000000000000000000dEaD/);
  const two = fresh();
  two.rows[3].has = "other";
  assert.throws(() => buildPlan(two, gas), /already holds @other/);
});

test("readiness flags an owner who cannot cover the day's plan", () => {
  const s = seeded();
  s.owner.erc20 = 39_000_000n;
  assert.deepEqual(problems(s), [`owner holds 39 USDC, the day's plan needs 700`]);
  assert.equal(OWNER, "0xA87D1A929a93FbC809391F5FF53aaB9bdA54EB46");
});
