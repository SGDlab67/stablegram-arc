import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { GeminiEvent, Venue } from "./forecast.ts";

const BASE = "https://api.gemini.com/v1/prediction-markets/events?limit=500";
const CACHE_DIR = new URL("../.cache/", import.meta.url);
const CACHE = new URL("events.json", CACHE_DIR);

async function get(query: string): Promise<GeminiEvent[]> {
  const r = await fetch(`${BASE}&${query}`, { signal: AbortSignal.timeout(25_000) });
  if (!r.ok) throw new Error(`gemini ${r.status}`);
  return ((await r.json()) as { data: GeminiEvent[] }).data;
}

// The whole feed is about 1000 events and 35 MB, and its first page misses most
// weather cities, so ask for what this venue needs: all Weather (1 MB), plus one
// search per team. Search matches a single word, so "Dallas Mavericks" is searched
// as "Mavericks" and forecast.ts does the exact match.
//
// The team searches are the slow ones: "Cowboys" and "Texans" also match every
// college team of that name and return 10 to 14 MB each. One of them timing out
// must not cost us the rest, so each query stands on its own and the plan is built
// from whatever came back. Only a total failure falls back to the last good
// response, and the source is reported so a thin plan is never passed off as a
// complete one.
// ponytail: one cache file, so switching venues while offline serves the other venue's teams.
export async function fetchEvents(venue: Venue): Promise<{ events: GeminiEvent[]; source: "live" | "partial" | "cache" }> {
  // Search needs 3 or more characters, so "Austin FC" is searched as "Austin".
  const word = (t: string) => t.split(" ").findLast((w) => w.length >= 3)!;
  const queries = ["category=Weather", ...venue.teams.map((t) => `category=Sports&search=${encodeURIComponent(word(t))}`)];
  const settled = await Promise.allSettled(queries.map(get));
  const failed = settled.filter((r) => r.status === "rejected");
  for (const [i, r] of settled.entries()) {
    if (r.status === "rejected") console.error(`gemini query failed (${queries[i]}): ${(r.reason as Error).message}`);
  }

  if (failed.length < settled.length) {
    const all = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const events = [...new Map(all.map((e) => [e.ticker, e])).values()];
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(CACHE, JSON.stringify(events));
    return { events, source: failed.length ? "partial" : "live" };
  }

  console.error(`every gemini query failed, using the cached response`);
  return { events: JSON.parse(await readFile(CACHE, "utf8")), source: "cache" };
}
