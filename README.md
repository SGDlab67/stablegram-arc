# Stableplan

**An agent that reads prediction-market odds on tonight's games and
tomorrow's weather, forecasts how busy your venue will be, and pays your
suppliers and your shift staff in USDC on Arc, inside limits you set.**

Built for the University Blockchain Conference Hackathon 2026 (Nov 13 to
20). Track: Agentic Payments and AI. Chain: Arc testnet, where gas is USDC.

| | |
| --- | --- |
| Owner dashboard, live | <https://stableplan.vercel.app/dashboard> |
| Demo video, 2m31 | <https://youtu.be/27QdtVTXsQ0> |
| Contract on Arc testnet | [`0x32d3b9d8...0000920FA`](https://explorer.testnet.arc.io/address/0x32d3b9d88168a5f2677a6513cfaa6ab0000920fa) |

Everything below is deployed and running. 41 Foundry tests, four of them
fuzzed at 256 runs, and 25 agent tests.

## What is in the repo

```
src/           Stableplan.sol, UsernameRegistry.sol, MockShare.sol
test/          Foundry tests, including the UTC day boundary fuzz
script/        Deploy.s.sol, refusals.sh
agent/src/     forecast and plan, chain writes (act.ts), server, attest, history backfill
agent/venues/  one JSON file per venue: baseline covers, staff, supplier, uplift priors
web/           Next.js app: the owner dashboard at /dashboard, the phone prototype at /
deployments/   arc-testnet.json, the addresses and ABIs everything else reads
spec/          SPEC.md and the submission answers
```

The agent never holds the dashboard's truth. It writes to the chain, a
QuickNode Stream delivers what the chain recorded to `POST /hooks/quicknode`,
and the dashboard renders that feed plus a backfill read at boot.

## Run it yourself

Nothing here needs a key to check. Both of these are read-only.

```sh
cd agent && npm install
npm run attest        # re-derive today's agent spend from the event log and
                      # assert it against the contract's own counter
cd .. && script/refusals.sh   # four things the contract will not let the agent do,
                              # each an eth_call against the deployed contract
forge test            # 41 tests
```

To run the agent itself you need the owner's keystore and the Keychain items
it names, which stay on the demo machine:

```sh
npm run plan          # today's forecast and plan, no writes
npm run serve         # the API the dashboard reads, plus the Stream webhook
npm run p2p           # a person to person send, dry run unless --live
```

## The problem

A venue commits money days before it knows what it needs.

- The food order goes in before anyone knows whether the home team is
  still in the race or a cold front will shut the patio. Order short and
  you turn away the best night of the month. Order long and you throw it
  out.
- The supplier deposit has to land before the supplier will hold stock,
  and it is almost always larger than any limit worth handing an agent.
- Filling a shift at short notice takes a payment that reaches the person
  the same day.

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
4. **Ask for the big one.** The supplier deposit is over the agent's
   per-send cap, so it becomes a proposal in the owner's inbox and nothing
   moves until the owner approves it. This is the normal case rather than
   an edge case: a deposit is almost always larger than a limit worth
   setting.
5. **Pay the small ones.** Short-notice shift payments go out by
   `@username` in USDC, inside the caps, with no human in the loop. Each
   memo carries the market and the odds that justified it.

## Contracts

Live on Arc testnet (chain 5042002), deployed at block 72,747,168:

| Contract | Address |
| --- | --- |
| `Stableplan` | `0x32d3b9d88168a5f2677a6513cFaa6Ab0000920FA` |
| `UsernameRegistry` | `0xF1b6362d7849a9A7324739677ADF0aB9dfd7F89f` |
| `MockShare` | `0xefbbC534bcd31c4e221CFD882A000b90beDa23a7` |

| Contract | What it does |
| --- | --- |
| `UsernameRegistry` | One name per address, case-insensitive, reverts on an unclaimed name |
| `Stableplan` | Pays by name with a note, as the owner or as the owner's agent, inside caps the contract enforces; holds standing orders and owner-approved proposals |
| `MockShare` | A test token for the unit tests |

Nothing is wrapped and nothing is held. `Stableplan` moves the token the
owner already holds, in the same transaction it receives the instruction, so
there is no balance here to drain and no new asset to bootstrap. A fuzz test
asserts its balance is always zero.

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

### Demo shortcut: who signs approve and reject

In the demo the local server holds the owner's key, while in production the owner signs in their own wallet. The dashboard's Approve and Reject buttons call `POST /approve` and `POST /reject` on the agent server, which opens the owner's Foundry keystore only to send and simulates every call first. The agent's own key can never approve: the contract only lets the proposal's `user` do that.

## Where this generalizes

The venue is the demo. The mechanism is a supplier deposit that an agent
proposes and an owner approves inside a cap the contract enforces, and
that shape is not specific to bars.

Allium's attribution of stablecoin payment volume for January to August
2026 puts supplier payments at 28 billion USD and B2B settlement at 137 to
153 billion USD. B2B also carries the highest cross-border share of any
category at 43 percent, against 61 percent of all attributed stablecoin
payment volume being domestic. That is where a deposit is genuinely hard
today: the supplier is in another country, there is no shared bank, and
production does not start until the money lands.

We are not claiming the venue market. We are claiming the deposit, which
is the leg with measured volume behind it.

## What we do not claim

- **That you can pay W-2 wages this way.** 29 CFR 531.27 requires wages in
  cash or a negotiable instrument payable at par, and several states
  including California independently require payment in US currency. The
  shift payments here are contractor payments. Hourly employees get
  dollars.
- **That the forecast is accurate.** The uplift factors are the owner's own
  numbers. A real product fits them from point-of-sale history.
- **That these markets are deep enough to hedge a venue.** Measured on
  2026-11-17, Austin's high-temperature market traded $323 in 24 hours, and
  most city weather markets traded nothing. Prices are a forecast signal
  here, not a hedge, and the dashboard shows each market's volume.
- **That prediction markets are a licensed insurance product.** Nothing here
  sells cover to anyone.
