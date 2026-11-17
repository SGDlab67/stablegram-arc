import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { GeminiEvent, Venue } from "./forecast.ts";

const BASE = "https://api.gemini.com/v1/prediction-markets/events?limit=500";
const CACHE_DIR = new URL("../.cache/", import.meta.url);
const CACHE = new URL("events.json", CACHE_DIR);

async function get(query: string): Promise<GeminiEvent[]> {
  const r = await fetch(`${BASE}&${query}`, { signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`gemini ${r.status}`);
  return ((await r.json()) as { data: GeminiEvent[] }).data;
}

// The whole feed is ~1000 events and 35 MB, which blows the 10 s budget, and its first page misses
// most weather cities. So ask for what the venue needs: all Weather (1 MB), plus a search per team.
// Search matches one word, so "Dallas Mavericks" is searched as "Mavericks"; forecast.ts does the exact match.
// Last good response is the fallback, so a network blip never breaks a demo.
// ponytail: one cache file, so switching venues while offline serves the other venue's teams.
export async function fetchEvents(venue: Venue): Promise<{ events: GeminiEvent[]; source: "live" | "cache" }> {
  try {
    // Search needs 3+ characters, so "Austin FC" is searched as "Austin".
    const word = (t: string) => t.split(" ").findLast((w) => w.length >= 3)!;
    const queries = ["category=Weather", ...venue.teams.map((t) => `category=Sports&search=${encodeURIComponent(word(t))}`)];
    const all = (await Promise.all(queries.map(get))).flat();
    const events = [...new Map(all.map((e) => [e.ticker, e])).values()];
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(CACHE, JSON.stringify(events));
    return { events, source: "live" };
  } catch (err) {
    console.error(`gemini fetch failed (${(err as Error).message}), using cache`);
    return { events: JSON.parse(await readFile(CACHE, "utf8")), source: "cache" };
  }
}
