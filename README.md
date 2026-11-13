# Project-Compliance

**Send someone a fraction of a share. Then let them vote it.**

Tokenized stocks give holders the price and leave out the rights. This
project adds the layer underneath: a share you can send to a person by name,
that checks eligibility before it moves, and that can actually be voted at a
shareholder meeting, by the holder or by an agent acting on their stated
values.

Built for the University Blockchain Conference hackathon 2026 and Monad
Blitz Oregon. The contracts are chain neutral and run on Arc testnet first.

## Why

You cannot send a friend $20 of Apple today.

- An ACATS transfer between brokerages takes 5 to 10 business days.
- Fractional shares cannot be transferred at all. They are a
  platform-specific construct, and ACATS moves whole shares only.
- The sender needs the recipient's full name, address, SSN or TIN and
  account number.

Tokenized stocks fix the movement and then drop the rights. Kraken's xStocks
FAQ says they "do not confer shareholder rights like voting or dividends
paid as cash". Measured on 2026-11-13, three xStocks on Solana (NVDAx, SPYx,
TSLAx) were held across 360,694 accounts holding $228.7M, and none of those
holders had a vote.

CRCLx on Monad mainnet
(`0xfEbDEd1B0986a8ee107f5AB1a1c5a813491DeCEB`) is a verified upgradeable
proxy with no vote checkpoints and no delegation, so a voting contract
cannot read past balances from it at all. That is the specific reason
`VoteShare` exists.

## How it works

1. **Claim a name.** One username per address, first come first served.
2. **Wrap.** Deposit the tokenized stock, receive a share that records
   balances at every past moment and refuses to move to an address the
   compliance role has not cleared.
3. **Send.** `sendToUsername("alice", 5e18)`. It arrives instantly, and on
   Arc the recipient needs no gas token because gas is USDC.
4. **Meeting.** The custodian publishes a record time, a deadline, the
   ballot items and a hash of the proxy document.
5. **Vote.** The holder votes, or an agent votes for them from their stated
   policy. Weight is whatever they held at the record time.
6. **Override.** The holder can take any agent vote back until the deadline.
7. **Tally.** At the deadline the totals are the instruction a custodian
   holding the real shares would act on.

## Contracts

| Contract | What it does |
| --- | --- |
| `MockShare` | Stand-in for a tokenized stock on testnet |
| `EligibilityRegistry` | Who may hold and vote. The rule is set by a compliance role, not hardcoded |
| `UsernameRegistry` | One name per address, resolved case-insensitively |
| `VoteShare` | `ERC20Wrapper` + `ERC20Votes`, gated transfers, send by username |
| `Ballot` | A meeting with several items, agent voting, holder override, tally |

Three decisions worth knowing:

- **The clock is timestamps, not block numbers.** Monad and Arc produce
  blocks at very different speeds, and a record date is a moment in the
  world.
- **Shares self-delegate on arrival.** `ERC20Votes` gives zero voting power
  until a holder delegates, which almost nobody does, so `VoteShare`
  delegates to the holder the first time shares land.
- **`Ballot` is not a Governor.** A Governor proposal is one decision; an
  annual meeting is a dozen on one agenda under one record date. The trade
  is that the counting is ours and has to be tested rather than inherited.

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
| Custodian | One wallet with the custodian role | The custodian voting the real shares |
| Compliance check | An allowlist set by one wallet | A KYC or attestation provider |
| Ballot items | Circle's real 2026 items, loaded by hand | A feed of filings |
| Tally | An event | An instruction a custodian acts on |

The one thing this cannot do on its own is make anybody vote the real
shares. An on-chain tally is an instruction, and somebody holding the
underlying has to honour it. That is the honest limit of the design.

## Prior art

Broadridge already runs proxy voting for tokenized stocks (Galaxy, Ondo,
NYSE, Dinari). It delivers the ballot to the holder. Two gaps remain, and
they are what this project is:

- Nobody reads the ballot for the holder or votes by a policy.
- xStocks, the largest family by volume, have no vote at all.

## Chain notes

- **Arc testnet**: chain ID 5042002, RPC `https://rpc.testnet.arc.io`,
  explorer `explorer.testnet.arc.io`, faucet `faucet.circle.com`. Gas is
  USDC and finality is under a second.
- **USDC on Arc has two faces.** The native balance uses 18 decimals and the
  ERC-20 interface uses 6, over one balance. Anything paying USDC must use
  the ERC-20 interface and 6 decimals.
- **Monad**: mainnet chain ID 143, testnet 10143.
- No hardcoded addresses anywhere. The port between chains is a redeploy.

## Licence

MIT.
