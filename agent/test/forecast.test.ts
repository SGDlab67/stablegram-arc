import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bucketProbs, bucketTemp, forecast, patioFactor, plan, relevantEvents, type Forecast, type GeminiEvent, type Venue } from "../src/forecast.ts";

const load = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const venue: Venue = load("../venues/austin-bar.json");
const events: GeminiEvent[] = load("./fixtures/events.json").data;
const DAY = "2026-11-18"; // Wednesday: Mavericks at 7pm local, Austin weather event

const tickers = (day: string) => relevantEvents(events, venue, day).map((e) => e.ticker);

function withWinProb(p: number): GeminiEvent[] {
  const copy = structuredClone(events);
  const game = copy.find((e) => e.ticker === "NBA-2611190100-GSW-DAL-M")!;
  const dal = game.contracts.find((c) => c.ticker === "DAL")!;
  dal.prices = { bestBid: String(p), bestAsk: String(p) };
  return copy;
}

test("relevantEvents picks local moneylines inside opening hours plus the city weather event", () => {
  assert.deepEqual(tickers(DAY), ["NBA-2611190100-GSW-DAL-M", "WXHIGH-AUS-2611190459"]);
  assert.deepEqual(tickers("2026-11-19"), ["NBA-2611200100-LAC-SAS-M"]); // Spurs; no weather event that day
  assert.deepEqual(tickers("2026-11-22"), ["NFL-2611221800-TEN-DAL-M"]); // Cowboys at noon
  assert.deepEqual(tickers("2026-11-30"), []);
});

test("no events gives baseline", () => {
  const f = forecast(venue, DAY, []);
  assert.equal(f.covers, venue.baselineCovers.wed);
  assert.equal(f.covers, f.baseline);
  assert.deepEqual(f.factors, []);
});

test("covers rise monotonically with the win probability", () => {
  const covers = [0.05, 0.2, 0.4, 0.5, 0.64, 0.8, 0.95].map((p) => forecast(venue, DAY, withWinProb(p)).covers);
  for (let i = 1; i < covers.length; i++) assert.ok(covers[i] > covers[i - 1], `${covers}`);
});

test("forecast reads the live-shaped fixture", () => {
  const f = forecast(venue, DAY, events);
  assert.deepEqual(f.factors.map((x) => x.ticker), ["NBA-2611190100-GSW-DAL-M", "WXHIGH-AUS-2611190459"]);
  assert.equal(f.factors[0].label, "Dallas Mavericks 65% win"); // mid of 0.64 / 0.65 rounds to 65
  assert.equal(f.factors[1].label, "high 71F");
  assert.ok(f.covers > f.baseline);
});

test("bucket probabilities normalize to 1", () => {
  for (const e of events.filter((x) => x.ticker.startsWith("WXHIGH-"))) {
    const b = bucketProbs(e);
    assert.ok(b.length > 0);
    assert.ok(Math.abs(b.reduce((s, x) => s + x.p, 0) - 1) < 1e-9, e.ticker);
  }
  const unpriced = structuredClone(events.find((e) => e.ticker === "WXHIGH-AUS-2611190459")!);
  for (const c of unpriced.contracts) c.prices = {};
  assert.deepEqual(bucketProbs(unpriced), []);
});

test("temperature buckets parse the labels Gemini sends", () => {
  assert.equal(bucketTemp("72°F to 73°F"), 72.5);
  assert.equal(bucketTemp("74°F or above"), 75);
  assert.equal(bucketTemp("65°F or below"), 64);
  assert.equal(patioFactor(60, venue.patio) > 0 && patioFactor(60, venue.patio) < 1, true);
  assert.equal(patioFactor(75, venue.patio), 1);
  assert.equal(patioFactor(30, venue.patio), 0);
  assert.equal(patioFactor(110, venue.patio), 0);
});

const synthetic = (day: string, covers: number): Forecast => ({ day, covers, baseline: 100, factors: [] });

test("plan never schedules fewer staff than scheduled", () => {
  for (let d = 15; d <= 21; d++) {
    const day = `2026-11-${d}`;
    const sched = venue.scheduled[["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(`${day}T00:00:00Z`).getUTCDay()] as keyof Venue["scheduled"]];
    for (let covers = 0; covers <= 600; covers += 10) {
      const p = plan(venue, synthetic(day, covers));
      assert.ok(p.servers >= sched.servers && p.cooks >= sched.cooks, `${day} ${covers}`);
      assert.equal(p.extraServers, p.servers - sched.servers);
      assert.equal(p.payments.length + p.unfilled, p.extraServers + p.extraCooks);
    }
  }
});

test("plan pays bonuses and a supplier deposit in USDC base units", () => {
  const f = forecast(venue, DAY, events);
  const p = plan(venue, f);
  assert.ok(p.payments.length > 0);
  // Read the rates from the venue, so sizing the demo to a testnet wallet does not break the test.
  for (const pay of p.payments) assert.equal(pay.amount, BigInt(venue.bonusUsd) * 1_000_000n);
  assert.equal(p.supplier?.username, "hillcountrymeats");
  assert.equal(typeof p.supplier?.amount, "bigint");
  assert.equal(p.supplier!.amount, BigInt(Math.round(f.covers * venue.foodCostUsd * venue.supplierDepositPct)) * 1_000_000n);
  // The deposit must break the per-send cap, or the demo never produces a proposal.
  assert.ok(p.supplier!.amount > 30_000_000n, "supplier deposit should exceed the 30 USDC per-send cap");
});

test("memos stay at or under 140 bytes and carry the reason", () => {
  const f = forecast(venue, DAY, events);
  const p = plan(venue, f);
  assert.match(p.payments[0].memo, /Dallas Mavericks 65% win, high 71F: \+\d+% covers/);
  assert.match(p.payments[0].memo, /NBA-2611190100-GSW-DAL-M/);
  const long: Forecast = {
    day: DAY,
    covers: 400,
    baseline: 150,
    factors: Array.from({ length: 8 }, (_, i) => ({ ticker: `NBA-2611190100-LONG-TICKER-${i}-M`, label: `Atlético Ünïcode Team ${i} 64% win`, prob: 0.64, effect: 10 })),
  };
  for (const x of [...p.payments, p.supplier!, ...plan(venue, long).payments, plan(venue, long).supplier!]) {
    assert.ok(Buffer.byteLength(x.memo) <= 140, x.memo);
  }
});
