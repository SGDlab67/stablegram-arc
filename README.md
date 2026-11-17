# Stableplan

**An agent that reads prediction-market odds on tonight's games and
tomorrow's weather, forecasts how busy your venue will be, and pays your
staff and suppliers in USDC on Arc, inside limits you set.**

Built for the University Blockchain Conference Hackathon 2026 (Nov 13 to
20). Track: Agentic Payments and AI. Chain: Arc testnet, where gas is USDC.

> This README is being rewritten as the build lands. The architecture,
> safety limits, Stream configuration and contract addresses below are the
> design; `spec/SPEC.md` is the authority until the final pass.

## The problem

A sports bar staffs Saturday on Tuesday.

- If the home team makes a late run, the bar is short-staffed on its best
  night of the month.
- If a cold front shuts the patio, the owner pays a full crew to stand
  around and throws away food ordered for a full house.
- Filling a shift at short notice takes a bonus, and that money has to
  reach the person the same day.

The uncertainty is already priced. Gemini's prediction markets quote
tonight's games and each city's high temperature, every day, live. No point
of sale or scheduling tool reads them.

## How it works

1. **Read the odds.** The agent pulls the Gemini markets that matter to one
   venue: tonight's games for the local teams, and the city's
   high-temperature market for tomorrow.
2. **Forecast the night.** It turns those prices into expected covers
   against a normal day for that weekday, factor by factor: "Texas 64% to
   win, high 81F, patio open: +38% covers."
3. **Plan the shift.** Extra servers and cooks, from the venue's own covers
   per server, plus the food order.
4. **Pay.** Short-notice bonuses go to staff by `@username` in USDC. Each
   payment's memo carries the market and the odds that justified it.
5. **Ask when it matters.** Anything over the agent's per-send cap, such as
   a supplier deposit, becomes a proposal in the owner's inbox. Nothing
   moves until the owner approves it.

## Contracts

| Contract | What it does |
| --- | --- |
| `UsernameRegistry` | One name per address, case-insensitive, reverts on an unclaimed name |
| `Stablegram` | Pays by name with a note, as the owner or as the owner's agent, inside caps the contract enforces; holds standing orders and owner-approved proposals |
| `MockShare` | A test token for the unit tests |

The payments contract is still named `Stablegram` in the source. It is
renamed with the next deployment.

## Agent safety limits

The agent is the part that can lose someone money, so the limits are in the
contract rather than in the prompt.

| Limit | Enforced by |
| --- | --- |
| One agent per owner, named by the owner | `agentOf`, set only by the owner |
| A cap per single payment, per token | `OverPerSendLimit` |
| A cap per rolling day, per token | `OverDailyLimit`, reset by UTC day |
| Both caps default to zero | A fresh agent can pay nothing until the owner sets a limit |
| Can only pay a claimed username | `mustResolve` reverts otherwise |
| Anything over the cap needs the owner | `propose`, then the owner's `approve` or `reject` |
| An agent cannot approve its own proposal | `NotYourProposal` |
| Revocable instantly, for every token at once | `authorizeAgent(address(0))` |
| The token's own rules still apply | A paused or restricted token reverts even when the agent pays |

The agent chooses who to pay and how much. It never chooses the limits.

## The agent's decision loop

1. **Read.** Fetch today's Gemini events, with the last good response cached
   so a network blip cannot break a demo.
2. **Select.** Keep the events that matter to this venue: a game whose teams
   match the venue's keywords and that starts during opening hours, and the
   venue city's high-temperature market.
3. **Forecast.** Expected covers, as the baseline for that weekday plus one
   effect per market. The maths is deterministic, so every number on the
   dashboard can be traced to a ticker and a price.
4. **Plan.** Extra staff, the bonus per shift, and the supplier order.
5. **Check its own leash.** Read `limitOf` and `remainingToday` before
   building anything, so it can say "that is over your cap" instead of
   sending a transaction that reverts.
6. **Act.** Within the caps, `sendAsAgent`. Over them, `propose` and wait
   for the owner. Every write is simulated first.
7. **Report.** The dashboard and the staff phones update from a QuickNode
   Stream on Arc, not from the agent's own say-so.

The agent can be wrong at steps 1 to 5 and still cannot exceed what the
owner allowed, because step 6 is enforced by code the agent does not
control.

## How Stableplan uses Arc

- **Gas is USDC**, so a line cook who has never touched crypto can receive a
  bonus and spend it without buying a gas token first. Every fee shows in
  dollars, usually under a cent.
- **Sub-second deterministic finality**, so a payment is done on one
  receipt, with no reorg window to design around.
- **Foundry throughout**, with one deploy script and no hardcoded addresses.
- The agent pays USDC through its **ERC-20 interface**, because native value
  cannot be pulled from an owner's account. This is the practical
  consequence of Arc's two-faced USDC: 18 decimals natively, 6 through the
  ERC-20 interface, over one balance.

## QuickNode Streams

The dashboard and the staff phones learn about a payment from a Stream, not
from the agent's own word. The agent can claim it paid someone; the Stream
says what the chain recorded.

| Setting | Value | Why |
| --- | --- | --- |
| `network` | `arc-testnet` | From the Streams OpenAPI enum, which lists `arc-testnet` and `arc-mainnet` |
| `dataset` | `logs` | Events are all we need. Blocks and receipts would ship the whole chain to learn the same thing |
| `dataset_batch_size` | `5` | Arc produces a block about every 0.5 seconds (measured: 50 blocks in 25 seconds), and a tip Stream on a sub-second chain is rejected below 5 |
| `elastic_batch_enabled` | `true` | A batch of 5 never waits to fill, so a payment still arrives at tip speed |
| `filter_function` | `agent/stream-filter.js` | Keeps only our contract's `Sent`, `Proposed`, `Approved` and `Rejected` logs, by address and topic, and returns null for a batch with none, so nothing is delivered for an empty batch |
| `destination` | `webhook` to the agent's `POST /hooks/quicknode` | The agent already holds the venue and the plan, so the feed is assembled where the decisions were made |
| `start_range` | the deploy block | No backfill of chain history we have no use for |

The filter was checked against Arc testnet with `POST /streams/test_filter`
before the Stream existed. That run is also how the payload shape below was
established, rather than assumed:

```
stream.data[block][transaction][log]
log = { address, topics, data, blockHash, blockNumber,
        blockTimestamp, transactionHash, transactionIndex, logIndex, removed }
```

The webhook fails closed. It answers 503 until the Stream's
`security_token` is in the macOS Keychain as `quicknode-stream-token`, then
compares it in constant time. The server binds to localhost, so the only way
it is reachable at all is the tunnel used for the demo.

## What we do not claim

- **That the forecast is accurate.** The uplift factors are the owner's own
  numbers. A real product fits them from point-of-sale history.
- **That these markets are deep enough to hedge a venue.** Measured on
  2026-11-17, Austin's high-temperature market traded $323 in 24 hours, and
  most city weather markets traded nothing. Prices are a forecast signal
  here, not a hedge, and the dashboard shows each market's volume.
- **That prediction markets are a licensed insurance product.** Nothing here
  sells cover to anyone.
