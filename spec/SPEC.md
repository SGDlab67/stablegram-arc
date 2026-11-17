# stablegram for venues: build spec (option B)

UBC 2026 hackathon. Submit by Fri 2026-11-20 12:00 PM CST. Pitch in Austin on Sat 2026-11-21.
Main track: Agentic Payments and AI. Chain award: Best use of Arc. Bounties: Gemini Prediction Markets, QuickNode Streams. Grok Bot only if we confirm it can call our API.

The earlier stablegram spec (Venmo for tokenized stocks) is in `spec/archive/`. That product is dropped. Its contracts carry over.

## 1. Product

**One line:** an agent for bars and restaurants that reads prediction-market odds on tonight's games and tomorrow's weather, forecasts how busy the venue will be, and pays staff and suppliers in USDC on Arc, inside limits the owner sets.

**The problem.** A sports bar staffs Saturday on Tuesday. If the home team makes a late playoff run or a cold front kills the patio, the owner is either short-staffed or paying people to stand around, and the food order is wrong either way. Short-notice shifts need a bonus to fill, and that money has to move the same day.

**Why prediction markets.** Gemini's markets price exactly the uncertainty the owner has: who plays, who wins, and how hot it gets, per city, per day. They are a live, priced forecast that no POS system has.

**Why Arc.** Staff and suppliers are paid in USDC with gas in USDC, so nobody needs a second token, and fees are cents in dollars. The agent can spend only inside caps the contract enforces, and anything bigger waits for the owner.

**Demo script (90 seconds of the video):**
1. Owner dashboard for an Austin sports bar: tonight's Gemini markets for local teams and the Austin high-temperature market, each with its odds.
2. The agent's forecast: "Texas plays at 7, 64% to win; high 81F, patio open. Expect 240 covers, +38% on a normal Saturday."
3. The plan: 3 extra servers and 1 extra cook; a $25 short-notice bonus each, paid now to @maria, @dev, @sam, @lee. Each payment's memo carries the market ticker and the odds.
4. Supplier deposit of $600 to @hillcountrymeats is over the agent's $100 per-send cap, so it arrives in the owner's inbox as a proposal. The owner taps Approve.
5. The QuickNode Stream fires on each `Sent` and `Proposed` event, and the dashboard feed and staff phones update live.
6. Closing beat (stretch S1): the owner also opted into a small weather hedge on Gemini, and the settled market shows the payout.

**What we do not claim.**
- That the forecast is accurate. The uplift factors are owner-set guesses that a real product would fit from POS history.
- That prediction markets are liquid enough to hedge a venue. On 2026-11-17 Austin's high-temperature market traded $323 in 24 hours. We say so.

## 2. Contracts (Solidity 0.8.28, Foundry, Arc testnet chain 5042002)

Keep `UsernameRegistry` (staff and suppliers are paid by @username) and `Stablegram` as they are, including agent caps and standing orders (base wages can be standing orders). `MockShare` can stay for tests.

**Add to `Stablegram`: proposals, for agent payments the owner must approve.**

| Function | Who | Does |
|---|---|---|
| `propose(address user, IERC20 token, string name, uint256 value, string memo) returns (uint256 id)` | `agentOf[user]` only | Resolves the name (reverts on unclaimed, zero value, memo over 140 bytes), stores the proposal, emits `Proposed(id, user, to, token, value, memo)`. No caps apply, because nothing moves. |
| `approve(uint256 id)` | the proposal's `user` only | Transfers `value` of `token` from `user` to `to` with `safeTransferFrom`, deletes the proposal, emits `Approved(id)` and the usual `Sent(..., byAgent = true)`. |
| `reject(uint256 id)` | the proposal's `user` only | Deletes it, emits `Rejected(id)`. |
| `proposalCount()` | view | |

Rules: the recipient is fixed at proposal time. Approving or rejecting twice reverts (`NoSuchProposal`). The contract still holds no balance, and the existing zero-balance fuzz test must keep passing. Errors are custom errors, in the existing style.

Deploy: `script/Deploy.s.sol` through `script/with-deployer.sh` (keystore password in the Keychain). It writes the addresses to `deployments/arc-testnet.json`. Arc USDC through its ERC-20 interface is `0x3600000000000000000000000000000000000000` (6 decimals).

## 3. Agent service (`agent/`, TypeScript on Node 26, `viem`)

No framework. Built-in `node:http` and `node:test`. Dependencies: `viem` only, plus `tsx` to run TypeScript.

**Inputs.**
- `agent/venues/austin-bar.json`: city code `AUS`, team keywords (for example `Texas`, `Longhorns`, `Austin FC`, `Spurs`, `Mavericks`), opening hours, baseline covers per weekday, patio seats, covers per server and per cook, scheduled staff per day, the bonus per short-notice shift, food cost per cover, staff and supplier usernames.
- Gemini public API, no key: `GET https://api.gemini.com/v1/prediction-markets/events` (response `{data, pagination}`; each event has `category`, `ticker`, `title`, `contracts`, `participants`, `tags`, `expiryDate`, `volume`). Weather tickers look like `WXHIGH-AUS-2611190459`, and the contracts are temperature buckets. Read the real shapes with curl before you code; do not guess field names.

**Pure core (`agent/src/forecast.ts`, unit tested).**
- `relevantEvents(events, venue, day)`: sports events whose participants or title match a team keyword and that start during opening hours, plus the venue city's `WXHIGH` event for that day.
- `forecast(venue, day, events)` returns `{covers, baseline, factors: [{ticker, label, prob, effect}]}`. Each game contributes `gameUplift + p_win * winUplift`, where `p_win` is the local team's win price. Weather contributes the patio covers expected over the temperature buckets: the sum over buckets of `p(bucket) * patioFactor(bucket)`. Bucket probabilities come from the contract prices, normalized to sum to 1.
- `plan(venue, forecast)` returns the extra servers and cooks, the bonus payments (`{username, amount, memo}`) and the supplier deposit. Amounts are in USDC base units as `bigint`.
- Tests: no events gives baseline covers; covers rise monotonically with the win probability; bucket normalization sums to 1; the plan never schedules fewer staff than are already scheduled.

**Acting (`agent/src/act.ts`).**
- For each payment: read `limitOf` and `remainingToday`. At or under the per-send cap and the remaining daily allowance, call `sendAsAgent`. Over either, call `propose`. Simulate every write first and never send one that would revert.
- The memo is at most 140 bytes and carries the reason: `"Texas 64% win, high 81F: +38% covers"`.
- `--dry-run` prints what it would send and sends nothing. Dry run is the default.
- Keys: the agent key is read at start from Keychain item `venue-agent-key` (`security find-generic-password -w -s venue-agent-key`). Never from a file, an env file or argv.

**Server (`agent/src/server.ts`).**
- `GET /plan?venue=austin-bar&day=YYYY-MM-DD`: the forecast and the plan as JSON.
- `POST /run?venue=austin-bar`: runs the plan (dry run unless the server was started with `--live`).
- `POST /hooks/quicknode`: the QuickNode Stream destination. It verifies the Stream's security token, decodes `Sent`, `Proposed`, `Approved` and `Rejected` from the payload and appends them to an in-memory feed.
- `GET /feed`: the decoded events, newest first.

**AI.** The track asks for an agent. The decision loop is deterministic so it can be audited. An optional `explain()` turns the factors into one sentence for the dashboard, and the payment memos never depend on it. Leave it out until M3 passes.

## 4. QuickNode Stream

One Stream on Arc testnet. Dataset: logs (receipts if logs are not offered for Arc). Filter: only logs from the `Stablegram` address whose topic0 is `Sent`, `Proposed`, `Approved` or `Rejected`, reduced to `{block, tx, event, args}`. Destination: a webhook to `POST /hooks/quicknode`, behind a tunnel for the demo. The README documents the network, dataset, filter code and destination, as the bounty requires. The API key is in Keychain item `quicknode-api-key`.

## 5. Web (`web/`, Charles)

Reuse the app shell, the passkey wallet and the username picker. New screens:
- **Today:** the market cards (ticker, title, odds, volume), the forecast number against the baseline, and the factors.
- **Plan:** extra shifts, the bonuses and the supplier deposit, each marked "agent pays" or "needs approval". One Run button.
- **Inbox:** proposals, with Approve and Reject (the owner's wallet signs `approve` and `reject`).
- **Feed:** live `Sent`, `Proposed` and `Approved` events from `GET /feed`.
- **Limits:** set `authorizeAgent` and `setLimit` for USDC.
- **Staff view:** "my bonuses" for a username.

Drop the Venmo screens (portfolio, buy, markets, requests) from navigation.

## 6. Milestones

| # | Owner | Done when |
|---|---|---|
| M1 | builder | Proposals in `Stablegram`, with tests; `forge test` green, including the existing 27 tests |
| M2 | builder | `npm test` green in `agent/`; `npm run plan -- --venue austin-bar` prints today's forecast and plan from live Gemini data |
| M3 | Claude + user | New contracts deployed to Arc testnet; one live run pays a bonus and creates one proposal; the owner approves it |
| M4 | Claude + user | The Stream delivers a `Sent` event to the webhook, and `/feed` shows it |
| M5 | Charles | The dashboard screens in section 5 against `/plan` and `/feed` |
| M6 | all | README (architecture, decision loop, safety limits, Stream config, addresses), 2 to 3 minute video, Devpost |
| S1 | stretch | A weather hedge on the Gemini sandbox, through authenticated trading with keys in the Keychain |
| S2 | stretch | Grok Bot, if confirmed at office hours |

## 7. Rules

- Everything is new code written during the hackathon week. The repo goes public before submission.
- No secrets in the repo, in argv or in shell history. Keychain only.
- No em dashes in code, comments, docs or commits. No AI attribution in commits.
- Commit locally on branch `venue-planner`. Nobody pushes without the user's go.
