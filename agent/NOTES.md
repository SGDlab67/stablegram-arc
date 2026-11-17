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
