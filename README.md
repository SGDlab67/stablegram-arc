# stablegram

**Send someone a fraction of a share, or a few dollars, by name. Say what
it was for. Or just text your agent and let it do it.**

Built for the University Blockchain Conference Hackathon 2026 (Nov 13 to
20). Live on Arc testnet, where gas is USDC.

## Why

You cannot send a friend $20 of Apple today.

- An ACATS transfer between brokerages takes 5 to 10 business days.
- **Fractional shares cannot be transferred at all.** They are a
  platform-specific construct, and ACATS moves whole shares only.
- The sender needs the recipient's full name, address, SSN or TIN and
  account number.

Tokenized stocks fix the movement and then drop the rights and the
experience. Measured on 2026-11-13, three xStocks on Solana (NVDAx, SPYx,
TSLAx) were held across 360,694 accounts holding $228.7M. You still cannot
send any of it to a person by name, with a note, from your phone.

stablegram is the missing half: a name instead of an address, a note instead
of a bare transfer, and an agent that can do it for you inside limits you
set.

## How it works

1. **Claim a name.** One username per address, first come first served,
   resolved case-insensitively so `Alice` and `alice` are the same person.
2. **Send.** `sendToken(share, "alice", 0.25e18, "quarter share, happy
   birthday")`. A quarter of a share, instantly, with a note. On Arc the
   recipient needs no gas token, because gas is USDC.
3. **Or send dollars.** `sendNative("alice", "dinner")` moves the chain's
   own currency, which on Arc is USDC.
4. **Or tell your agent.** Authorize one agent, cap it per send and per day
   per token, and text it. It can never exceed the caps, never reach an
   unclaimed name, and you can revoke it in one transaction.
5. **Or write it once.** `createOrder(share, "alice", 0.25e18, firstAt,
   7 days, "weekly quarter share")` is a standing order. Anyone may trigger
   it when it falls due, your agent or a stranger, and whoever does chooses
   nothing: the recipient, the amount and the schedule are yours.

Every send emits the same `Sent` event with the note attached. That event
log is the feed.

## Contracts

| Contract | What it does |
| --- | --- |
| `MockShare` | Stand-in for a tokenized stock on testnet |
| `UsernameRegistry` | One name per address, case-insensitive, reverts on an unclaimed name |
| `Stablegram` | Send any token or the native currency by name, with a note, as yourself or as someone's agent |

Two decisions worth knowing:

- **Nothing wraps the asset.** stablegram sends the token you already hold,
  so it works with any ERC-20 on day one and inherits whatever rules that
  token enforces. No wrapper, no allowlist, no new asset to bootstrap.
- **`Stablegram` holds nothing and has no owner.** It moves value in the
  same transaction it receives the instruction. There is a fuzz test
  asserting its balance is always zero.

## Agent safety limits

The agent is the part that can lose someone money, so the limits are in the
contract rather than in the prompt.

| Limit | Enforced by |
| --- | --- |
| One agent per user, named by the user | `agentOf`, set only by the user |
| A cap per single send, per token | `OverPerSendLimit` |
| A cap per rolling day, per token | `OverDailyLimit`, reset by UTC day |
| Both caps default to zero | A fresh agent can send nothing until the user sets a limit |
| Can only send to a claimed username | `mustResolve` reverts otherwise |
| Cannot send the native balance | Nothing can pull native value from a user's account |
| Revocable instantly, for every token at once | `authorizeAgent(address(0))` |
| The token's own rules still apply | A paused or restricted token reverts even when the agent sends |

The agent chooses the recipient and the amount. It never chooses the
limits.

## Standing orders

A standing order is the safest thing an agent can do for you, because it
takes the agent's judgement out entirely. You write the order; the agent
only presses the button when it is due.

| Rule | Enforced by |
| --- | --- |
| Only you write or cancel your order | `createOrder`, `cancelOrder` (`NotYourOrder`) |
| It can only reach a claimed name | The name is resolved when the order is written |
| It pays once per period at most | `runOrder` reverts with `NotDue` until the next slot |
| A period nobody triggered is skipped, never paid twice later | `nextAt` jumps to the next future slot |
| You can stop it without touching the order | Lower the token allowance and `runOrder` reverts |

Orders are for tokens only, because nothing can pull the native balance.
The interval is a fixed number of seconds, so "every birthday" is every 365
days; a calendar-aware schedule is the agent's job, by cancelling and
re-creating.

## The agent's decision loop

1. **Read.** A message arrives: "send alice 20 bucks for pizza". The agent
   parses the recipient, the token, the amount and the note.
2. **Resolve.** It looks the name up on chain. An unclaimed name stops here,
   and it asks rather than guessing.
3. **Check its own leash.** It reads `limitOf` and `remainingToday` before
   it builds anything, so it can say "that is over your daily cap, I have
   $40 left" instead of sending a transaction that reverts.
4. **Confirm.** Anything at or near the per-send cap goes back to the human
   in words before it moves.
5. **Send.** It calls `sendAsAgent`, which re-checks every limit on chain.
   The contract, not the prompt, is what actually stops it.
6. **Report.** It replies with the transaction hash and the new remaining
   allowance for the day.

The agent can be wrong at steps 1 to 4 and still cannot exceed what the
user allowed, because step 5 is enforced by code the agent does not
control.

## How stablegram uses Arc

- **Gas is USDC**, so a recipient who has never touched crypto needs no gas
  token to receive or to send onward. Fees are quoted in dollars.
- **`sendNative` moves the chain's own currency**, which on Arc means
  sending someone dollars is a native transfer, not an ERC-20 call.
- **Sub-second deterministic finality**, so the app confirms on one receipt
  with no reorg window to design around.
- **Foundry throughout**, which the Arc award asks for, with one deploy
  script and no hardcoded addresses.
- The agent path deliberately uses USDC's **ERC-20 interface** rather than
  the native balance, because native value cannot be pulled from a user's
  account. This is the practical consequence of Arc's two-faced USDC:
  18 decimals native, 6 through the ERC-20 interface, over one balance.

## QuickNode Streams

Not configured yet. The design: one Stream on Arc testnet filtered to the
`Sent` event from `Stablegram`, delivered to a webhook that writes the feed
and pushes a notification to the recipient.

Every send, token or native, as yourself or through an agent, emits the same
signature, so one filter covers the whole system:

```
Sent(address indexed token, address indexed from, address indexed to,
     string name, uint256 value, string memo, bool byAgent)
```

## Grok Bot

Not built yet. Grok Bot is xAI's assistant inside X, so the role here is
watching on-chain activity and acting on it rather than answering
questions.

## Deployed addresses

Arc testnet, chain ID 5042002, deployed in block 72245663. Explorer:
`explorer.testnet.arc.io`.

`Stablegram` was redeployed on 2026-11-15 in block 72458620 to add standing
orders. The registry and the share did not move, so every username carried
over. The first deployment, `0x1EfA8bF4c206503Edd598D35B7E0F8d32C353ab2`,
still holds the two rehearsal sends from 2026-11-13 listed below.

| Contract | Address |
| --- | --- |
| `Stablegram` | `0xBaDF08F324D5B4eaac5E33Ae30cA57C1096e5dBA` |
| `UsernameRegistry` | `0x9100A33057302d106850D42Eb09f2896480ea3Ee` |
| `MockShare` | `0x7cb45eB5C729061295f84C69e0eb3961f28a9f64` |

## Run it

```bash
forge build
forge test
```

Deploy to Arc testnet. Fund the deployer with test USDC from
`faucet.circle.com` first, because gas on Arc is USDC.

```bash
# one time: import the deployer into Foundry's encrypted keystore
cast wallet import arc-deployer --interactive

forge script script/Deploy.s.sol:Deploy \
  --rpc-url arc_testnet \
  --account arc-deployer \
  --broadcast
```

Never pass a private key on the command line. The keystore prompts for the
password and nothing lands in shell history.

## The phone app

There are two clients in this repo.

- `web/` is the app: Next.js, every screen, running on sample data today. It
  is being wired to the contracts through `deployments/arc-testnet.json`.
  Run it with `cd web && npm install && npm run dev`.
- `demo/index.html` is the reference client that talks to the chain now: one
  file, ethers from a CDN, no build step, no framework.

To run the reference client, serve it, open it in Safari, then Share and Add
to Home Screen for a full screen app with no browser chrome.

```bash
cd demo && python3 -m http.server 8000
```

It carries two throwaway testnet accounts instead of a wallet connector,
because mobile wallet deep linking is what breaks live demos. A judge picks
"as alice" or "as bob" and sends. Those keys live in `demo/demo-keys.js`, which
is gitignored and holds nothing of value.

Rehearsed end to end on Arc testnet on 2026-11-13: both usernames claimed, a
0.25 mCRCL send and a 1.5 USDC native send, each with a note, both in the feed.

| What | Transaction | Cost |
| --- | --- | --- |
| Send a quarter share with a note | `0xc8c3f9fbeef8b443c94b0d174a1ba53edf669a7e9c5d45b6a5a3f0a2259d6712` | 0.0025 USDC |
| Send 1.5 dollars with a note | `0xaa4c5e89a4feda0fc85efa9a81a579c84c3a5ad98a520b1da877621e4a8e5471` | 0.0011 USDC |

Standing orders, rehearsed on 2026-11-15 against the current deployment: a
weekly quarter share to alice, written, run once, refused on a second run in
the same period, then cancelled.

| What | Transaction | Cost |
| --- | --- | --- |
| Write the order | `0xc0e6a32c76ec3999aa57b21cbc9db06b9414aa1125ab0d54e83e85a35afbdaac` | 0.0077 USDC |
| Run it | `0xda35f8d0ee3610165f4925426e73dcfa5867b1750640d2c73e555642d08295b4` | 0.0022 USDC |
| Cancel it | `0xfff4adf01d003b6cee22e70444e2d7cedf72c50dedc50ecdf351c4724be23fb5` | 0.0017 USDC |

Gas is paid in USDC, so those are literal fractions of a cent, and the
recipient never needs a separate gas token.

## What is real and what is mocked

Judges mark down a demo that hides its mocks, so here they are.

| Piece | In this repo | The real version |
| --- | --- | --- |
| Tokenized stock | `MockShare` on testnet | CRCLx or an xStock on mainnet |
| Usernames | On-chain, first come first served | The same, plus recovery and a dispute process |
| Agent | Sends inside on-chain caps | The same, and this part is not mocked |

The honest limit: this moves a tokenized claim, not the registered share.
Whether the holder is a shareholder of record is the issuer's and the
transfer agent's call, not ours. That is a business problem, not a contract
one.

## Chain notes

- **Arc testnet**: chain ID 5042002, RPC `https://rpc.testnet.arc.io`,
  explorer `explorer.testnet.arc.io`, faucet `faucet.circle.com`. Gas is
  USDC and finality is under a second.
- **USDC on Arc has two faces.** The native balance uses 18 decimals and the
  ERC-20 interface uses 6, over one balance. An agent sends through the
  ERC-20 interface, because native value cannot be pulled from a user.
- No hardcoded addresses anywhere. Porting between chains is a redeploy.

## Licence

MIT.
