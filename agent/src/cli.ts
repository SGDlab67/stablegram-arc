import { parseArgs } from "node:util";
import { formatUnits, type Address } from "viem";
import { fetchEvents } from "./gemini.ts";
import { forecast, market, plan, relevantEvents, today } from "./forecast.ts";
import { loadVenue } from "./venue.ts";
import { act } from "./act.ts";

const { values } = parseArgs({
  options: { venue: { type: "string", default: "austin-bar" }, day: { type: "string" }, owner: { type: "string" }, act: { type: "boolean" } },
  allowPositionals: false,
});
const venue = await loadVenue(values.venue!);
const day = values.day ?? today(venue.timezone);
const { events, source } = await fetchEvents(venue);
const f = forecast(venue, day, events);
const p = plan(venue, f);

console.log(`${venue.name}, ${day} (${events.length} Gemini events, ${source})\n`);
console.log("Markets");
const markets = relevantEvents(events, venue, day).map((e) => market(e, venue));
if (!markets.length) console.log("  none for this day");
for (const m of markets) {
  console.log(`  ${m.ticker}  ${m.title}  (24h volume $${m.volume24h ?? "?"})`);
  console.log(`    ${m.odds.map((o) => `${o.label} ${Math.round(o.p * 100)}%`).join(" | ")}`);
}
console.log(`\nForecast: ${f.covers} covers vs ${f.baseline} baseline (${f.covers >= f.baseline ? "+" : ""}${f.covers - f.baseline})`);
for (const x of f.factors) console.log(`  ${x.label}  ${x.effect >= 0 ? "+" : ""}${x.effect} covers  [${x.ticker}]`);
console.log(`\nPlan: ${p.servers} servers (+${p.extraServers}), ${p.cooks} cooks (+${p.extraCooks})`);
for (const x of p.payments) console.log(`  $${formatUnits(x.amount, 6)} to @${x.username}  "${x.memo}"`);
if (p.unfilled) console.log(`  ${p.unfilled} extra shift(s) have no staff username to pay`);
if (p.supplier) console.log(`  $${formatUnits(p.supplier.amount, 6)} to @${p.supplier.username}  "${p.supplier.memo}"`);

if (values.act) {
  if (!values.owner) throw new Error("--act needs --owner 0x...");
  console.log("\nDry run (reads and simulates on Arc testnet, sends nothing)");
  for (const r of await act(p, values.owner as Address, false)) console.log(`  ${r.fn}: ${r.call}\n    simulation: ${r.simulation}`);
}
