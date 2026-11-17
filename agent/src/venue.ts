import { readFile } from "node:fs/promises";
import type { Venue } from "./forecast.ts";

export async function loadVenue(name: string): Promise<Venue> {
  if (!/^[\w-]+$/.test(name)) throw new Error(`bad venue name: ${name}`);
  return JSON.parse(await readFile(new URL(`../venues/${name}.json`, import.meta.url), "utf8"));
}
