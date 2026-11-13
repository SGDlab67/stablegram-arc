# stablegram

**Send someone a fraction of a share, or a few dollars, by name. Say what
it was for. Or just text your agent and let it do it.**

Built for the University Blockchain Conference Hackathon 2026 (Nov 13 to
20) and Monad Blitz Oregon. Contracts are chain neutral and run on Arc
testnet first, where gas is USDC.

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

stablegram is the missing half: a share that knows who is allowed to hold
it, a name instead of an address, a note instead of a bare transfer, and an
agent that can do it for you inside limits you set.

## How it works

1. **Claim a name.** One username per address, first come first served,
   resolved case-insensitively so `Alice` and `alice` are the same person.
2. **Wrap.** Deposit the tokenized stock and receive a share that refuses to
   move to anyone the compliance role has not cleared.
3. **Send.** `sendToUsername("alice", 0.25e18, "quarter share, happy
   birthday")`. A quarter of a share, instantly, with a note. On Arc the
   recipient needs no gas token, because gas is USDC.
4. **Or send dollars.** `sendNative("alice", "dinner")` moves the chain's
   own currency, which on Arc is USDC.
5. **Or tell your agent.** Authorize one agent, cap it per send and per day
   per token, and text it. It can never exceed the caps, never reach an
   unclaimed name, and you can revoke it in one transaction.

Every send emits the same `Sent` event with the note attached. That event
log is the feed.

## Contracts

| Contract | What it does |
| --- | --- |
| `MockShare` | Stand-in for a tokenized stock on testnet |
| `EligibilityRegistry` | Who may hold the share. The rule is set by a compliance role, not hardcoded |
| `UsernameRegistry` | One name per address, case-insensitive, reverts on an unclaimed name |
| `GatedShare` | `ERC20Wrapper` with an eligibility gate on every transfer, plus send-by-name with a note |
| `Stablegram` | Send any token or the native currency by name, with a note, as yourself or as someone's agent |

Three decisions worth knowing:

- **The gate is the feature, not the obstacle.** A payment app moves value
  to whoever you name. A share has to check first, because the issuer's
  terms say who may hold it. Doing that check inside the transfer is what
  lets the thing being sent be a real security rather than a token that
  looks like one.
- **Unwrapping is always allowed.** The gate blocks receiving, never
  burning, so it can never trap somebody's shares. There is a test for it.
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
| The token's own rules still apply | The eligibility gate bites even when the agent sends |

The agent chooses the recipient and the amount. It never chooses the
limits.

## Deployed addresses

| Network | Chain ID | Addresses |
| --- | --- | --- |
| Arc testnet | 5042002 | to be filled on first deploy |
| Monad testnet | 10143 | to be filled at Monad Blitz |

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

## What is real and what is mocked

Judges mark down a demo that hides its mocks, so here they are.

| Piece | In this repo | The real version |
| --- | --- | --- |
| Tokenized stock | `MockShare` on testnet | CRCLx or an xStock on mainnet |
| Compliance check | An allowlist set by one wallet | A KYC or attestation provider |
| Usernames | On-chain, first come first served | The same, plus recovery and a dispute process |
| Agent | Sends inside on-chain caps | The same, and this part is not mocked |

The honest limit: this moves a wrapped claim, not the registered share. A
transfer agent still has to recognise the wrapper for the holder to be a
shareholder of record. That is a business problem, not a contract one.

## Chain notes

- **Arc testnet**: chain ID 5042002, RPC `https://rpc.testnet.arc.io`,
  explorer `explorer.testnet.arc.io`, faucet `faucet.circle.com`. Gas is
  USDC and finality is under a second.
- **USDC on Arc has two faces.** The native balance uses 18 decimals and the
  ERC-20 interface uses 6, over one balance. An agent sends through the
  ERC-20 interface, because native value cannot be pulled from a user.
- **Monad**: mainnet chain ID 143, testnet 10143.
- No hardcoded addresses anywhere. Porting between chains is a redeploy.

## Licence

MIT.
