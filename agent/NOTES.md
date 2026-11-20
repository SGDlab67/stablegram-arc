# agent notes

Checked against the live Gemini API on 2026-11-17. The fixture `test/fixtures/events.json` is nine real events, every field as returned.

## Real shapes (and where they differ from the spec)

- `GET /v1/prediction-markets/events` returns `{data, pagination: {limit, offset, total}}`. `limit` is capped at 500 and the feed was 1003 events (about 18 MB per 500, not compressed). One page takes 4 to 13 s, so a full pull cannot meet a 10 s timeout. The first page also holds only 37 of the 98 weather events (Austin is on page 1 today by luck).
- The API ignores `status`, `ticker`, `tag`, `q`. It honours `category` (Sports, Weather, Crypto, Commodities) and `search`. Search matches a single word (min 3 characters, `FC` is a 400); a two-word phrase mostly returns nothing. So `gemini.ts` asks for all `category=Weather` (1 MB) plus one `category=Sports&search=<last word of team>` per team, and merges by ticker.
- Results are ordered soonest first and include settled events. Filter on `status === "active"`.
- Event: `id, title, slug, type, category, ticker, status, createdAt, effectiveDate, isLive, participants, volume, volume24h, tags, expiryDate, startTime, subcategory, events (nested related markets), contracts`. Weather events have no `startTime`, no `participants`, no `tags` worth using.
- Sports: the win market is the event whose ticker ends in `-M` (moneyline). `-S` spread, `-T` total, `-TT` team total and `-PP*` player props share the same participants and must not count as a win market. Win markets have two contracts. `contract.ticker` equals `participants[].abbreviation`, which is how a contract maps to a team. `contract.label` is a short name (`Dallas`, `Los Angeles C`); `contract.target.name` has the full name on NBA and NFL but is absent on college basketball, so `participants[].name` is the one to use. `startTime` is UTC ISO. `expiryDate` is days after the game.
- Weather: ticker `WXHIGH-AUS-2611190459`. The date in the ticker is the expiry (04:59 UTC the day after), so it is the local day plus one. The local day is only in the title (`Highest temperature in Austin on November 18, 2026?`), and that is what `forecast.ts` parses. Contracts are buckets, `label` is `72°F to 73°F`, `74°F or above` (has `strike {type: above, value}`), `65°F or below`. The degree sign is a real `°`.
- Prices are strings in `contract.prices`: `buy {yes, no}`, `sell {yes, no}`, `bestBid`, `bestAsk`, sometimes `lastTradePrice`. Books are often one-sided (only `bestAsk`, or only `bestBid`), and the weather bucket prices do not sum to 1 (the 2026-11-17 Austin buckets, ask-only or bid-only, sum to 1.35; the 11-18 ones to 1.005). The code uses the bid/ask mid, else the one side that exists, else last trade, and normalizes the buckets.
- Austin's market on 2026-11-18 had `volume24h` of $0 at the time of the fetch; the spec's $323 was the 17th.

## Choices

- Team keywords are full names (`Dallas Mavericks`, not `Mavericks`), matched against participant names. The short words also match `UT Arlington Mavericks`, `Wyoming Cowboys` and `Texas Tech`.
- `relevantEvents` keeps only moneylines, not every market that names the team.
- Opening hours are hours after local midnight; `close: 26` means 2 am. Game time is converted from UTC to the venue timezone.
- A weather factor's `prob` is the expected patio factor (how likely the patio is usable), `effect` is `seats * turns * (open - baselineFactor)` covers. The uplift numbers in the venue file are guesses, as the spec says.
- `plan` names only the staff in the venue file; shifts beyond that are reported as `unfilled`.
- Memo: the reason, then as many whole tickers as fit in 140 bytes.
- `--owner` (the venue owner's address) is a flag on the CLI and the server, because the venue file has no wallet in it.
- Not done: `tsc` typecheck (no `typescript` dependency, tsx strips types), the optional `explain()`.

## Unverified

- The QuickNode payload shape and its auth. `/hooks/quicknode` takes raw logs as an array, `{data: [...]}` or nested, and checks `Authorization: Bearer <token>` or `x-qn-token`. QuickNode's own HMAC signature headers are not implemented. Confirm both when the Stream exists (M4).
- `act.ts` was never run live. Dry run simulates from the owner's authorized agent address (so it works without the key); `propose` reverts in simulation until the new contract is deployed.
- A transaction under 20 gwei is dropped on Arc (old spec note). viem's default fee estimate is used and not checked.

## Seeding the demo (M3)

- `npm run seed -- [--dry-run|--live]` (dry run is the default) prints a numbered plan against the live chain, then in `--live` runs it in order. Re-running skips what is already true. `npm run verify` prints the readiness table and sends nothing (exit 1 when not ready).
- The six demo accounts (agent, maria, dev, sam, lee, hillcountrymeats) come from one mnemonic in Keychain item `stableplan-demo-mnemonic`, address index in that order. If the item is missing the script prints only the `security add-generic-password ... -w` command (it prompts, so nothing lands in argv or history) and exits. It never generates, prints or stores a mnemonic. The agent's key is copied into `venue-agent-key` through `security -i` on stdin, never overwriting an existing item.
- The owner signs from the Foundry keystore `arc-deployer` with the password from Keychain item `arc-deployer-keystore`. That path only runs in `--live` and has not been run.
- Gas: each account is funded to 125% of its calls at the live `maxFeePerGas`, rounded up to a micro-USDC (native is 18 decimals, the ERC-20 view 6). The agent gets a flat budget of 10 sends at 300k gas.
- The plan assumes the day costs at most 700 USDC (4 bonuses of 25 plus a deposit of up to 600). The allowance is set to that, and readiness fails while the owner holds less. On 2026-11-17 the owner held 39.78.
- Arc rejects native transfers to the well known Hardhat/Foundry test addresses (the `test ... junk` mnemonic), so do not use that mnemonic for the demo accounts.

## Dashboard endpoints (M5)

- `GET /proposals` reads the open proposals from the chain (`proposalCount`, then `proposals(id)`, skipping a zero `user`, the mark of an approved or rejected one) and resolves each `to` with `UsernameRegistry.nameOf`. Values are decimal strings. Empty array on a fresh chain.
- `POST /approve` and `POST /reject` take `{id}`, simulate with `publicClient.call` and refuse (409) anything that would revert. Same guard as `/run`: bad origin is 403, no `--owner` is 500. Like `/run`, they send only under `--live`; otherwise they simulate and return `{live: false, hash: null, status}`.
- `GET /plan` tags each payment with `fn` (`sendAsAgent` or `propose`), from the owner's `limitOf` and `remainingToday` and the same `route` rule `act.ts` uses, so the dashboard can say "agent pays" or "needs your approval" before Run. Left out when no `--owner` or the read fails.
- **Demo shortcut: in the demo the local server holds the owner's key, while in production the owner signs in their own wallet.** The key is opened from the Foundry keystore `arc-deployer` (`ownerAccount` in `demo.ts`, shared with `seed.ts`) only at the moment of a live send.
- Not verified: a live approve or reject, because the chain has no proposals until it is seeded. `/proposals` against the real chain returns `[]`.

## Hosted dashboard on Vercel (2026-11-19)

- The web app goes to Vercel (root directory `web`); the agent stays on the presenter's laptop behind `ngrok http 8787`, public at `https://strut-goggles-unglazed.ngrok-free.dev`. The hosted page is only a window onto that laptop: no laptop or no tunnel means every panel reads "Agent offline".
- `NEXT_PUBLIC_AGENT_URL` is the only variable the web app reads, and `web/src/app/dashboard/page.tsx` is the only file that reads it. Next inlines it into the client bundle at build time (checked: the ngrok host appears in `.next/static/chunks/*.js` after a build with it set), so changing it on Vercel needs a redeploy, not an agent restart.
- The server must run as `npm run serve -- --origin https://<project>.vercel.app --owner 0x... --live`. `allowed()` is an exact string compare and `access-control-allow-origin` is set only on the same match, so a wrong `--origin` breaks the read-only panels (blocked by CORS) as well as the money routes (403 bad origin). The traps are the default `http://localhost:3000`, a trailing slash, and Vercel's per-deployment preview hostnames, which are not the production one.
- The running tunnel has no domain in its config, so the URL is the account's assigned free static domain rather than a random one, and a restart should reuse it. Not worth trusting: start it as `ngrok http 8787 --url strut-goggles-unglazed.ngrok-free.dev`. If the host ever does change, `NEXT_PUBLIC_AGENT_URL` has to change with it and the app has to be redeployed; nothing on the agent side cares.
- **Blocker, measured 2026-11-19:** the free tunnel answers browser requests with ngrok's own warning page. `curl .../feed` returns the agent's JSON, the same request with a browser User-Agent returns `200 text/html` with `ngrok-error-code: ERR_NGROK_6024`, and adding `ngrok-skip-browser-warning: 1` returns `application/json` again. So from a Vercel origin the dashboard gets HTML where it expects JSON and reports a parse error rather than "Agent offline". It cannot send that header itself: it is not CORS-safelisted, so it would force a preflight, and the server allows only `content-type`. Fix it on the tunnel (a plan without the interstitial, or a different tunnel), not in the web app or in `server.ts`.
- `npm run build` and `npm run lint` in `web/` both pass unchanged on Next 16.4.6, 26 routes, `/dashboard` prerendered static. No `vercel.json` was added: the Next preset covers the build, and a `web/vercel.json` is only read once the root directory is already `web`.

## Demo day money and the hosted origin (2026-11-20)

Corrects the entry above: the ngrok interstitial was fixed in this repo after all, not left to the tunnel.
`page.tsx` sends `ngrok-skip-browser-warning: 1` on all three agent calls and `server.ts` adds that header
to `access-control-allow-headers`, so the preflight passes. `--origin` now takes a comma-separated list, so
the local page and the hosted page are allowed at once instead of one replacing the other. Verified through
the live tunnel: the Vercel origin and `http://localhost:3000` both get `access-control-allow-origin`, an
unknown origin gets none and 403 on `/approve`. Live at https://stableplan.vercel.app (the short production
alias is public; the team-suffixed hostname is behind Vercel SSO, so do not hand that one out).

`DAY_USDC` is sized from *baseline* covers while the plan sizes the real deposit from *forecast* covers, so
the allowance is structurally short on exactly the busy days this demo exists to show. Numbers on the day:

- `dayBudget()` gives 178 = 4 bonuses of 25, plus 260 busiest baseline covers x 6.00 food cost x 5% = 78.
- The live plan asked for 139: 462 forecast covers (+172% on the odds) x 6.00 x 5%.
- So a full run plus approval needs 239, against a 178 allowance and an owner balance of 219.647126.

Approving the already open proposal 0 (92) is inside both and works. A fresh `/run` then an approval is not:
raise it with `STABLEPLAN_DAY_USDC` and top the owner up first. `problems()` already fails on a balance below
the budget, so the hole is the budget number, not the readiness check.

`Stableplan.approve(id)` moves the owner's own money: it emits `Sent(byAgent: true)` but never touches
`spentOf`, so an owner approval does not count against the agent's daily cap. That is the design (the cap
bounds what the agent moves on its own), and `attest.ts` has to account for it: it drops any `Sent` sharing a
transaction with an `Approved`, or it would report a mismatch the first time the demo uses the approval path.

`npm run attest` re-derives the day's agent spend from the event log and checks it against `spentOf`,
`limitOf` and `remainingToday`. It reads only, signs nothing. The table is empty until a live agent send
happens inside the current UTC day, which is the thing to do on camera before running it.
