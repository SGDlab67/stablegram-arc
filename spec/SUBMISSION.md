# Devpost submission: Stableplan

UBC Hackathon 2026. Project 1546499, https://devpost.com/software/stablegram

The project page (tagline, description, built with, links) is filled in on Devpost.
These are the nine form field answers, as submitted on 2026-11-20.

---

## 1. Title & Team Members (required)

```
Stableplan

Huu Tai Le, Oregon State University. Contracts, agent, Arc integration.
Charles Sneed. App, design, demo.
```

Charles's affiliation is not in here because I do not have it. Everything else in this
field is correct; edit the submission to add it.

---

## 2. Main Track (required, pick one)

```
Agentic Payments and AI
```

---

## 3. Chain Award (required, pick one)

```
Best use of Arc
```

---

## 4. Bounty submissions (required, multi-select)

```
Best Project built with Gemini Prediction Markets
Best Use of QuickNode Streams
```

Not ElevenLabs and not Grok Bot. We do not use either, and claiming them would not survive a look at the repo.

---

## 5. Project Description (required)

```
An agent that reads prediction-market odds on tonight's games and the city
forecast, works out how busy a bar will be, and pays its supplier and its shift
staff in USDC on Arc inside caps the owner set in a contract.

What did you build?

A venue commits money before it knows what it needs. The food order and the
supplier deposit both go in days early, and the deposit is the bigger number: on
our demo venue it lands between $130 and $190 depending on how the night looks.
Guess low and you turn people away. Guess high and you have paid for food you
will throw out.

What the owner is guessing at (who plays, who wins, how hot it gets) is already
priced every day in Gemini's prediction markets. Nothing in a venue's stack reads
them, so we built the thing that does, and then had to solve the harder problem
of letting software spend money without handing it the keys.

What problem does it solve?

Two, and the second is the one we care about. Short notice staffing needs money
to move the same day, and an agent that can move money needs a leash that is not
a prompt. We put the leash in the settlement contract.

How does it work?

Every morning the agent pulls the Gemini markets for the venue's local teams and
its city high-temperature market, converts them into expected covers against a
normal day for that weekday, and derives the staffing gap and the supplier
deposit. The forecast is deterministic, so any decision can be replayed from the
same inputs.

Then the plan splits by what the agent is allowed to do. Four shift bonuses at
$25 each sit under the $30 per-send cap, so the agent pays them and nobody is
asked. Today's supplier deposit is $134, over the cap, so it becomes a proposal
in the owner's inbox and nothing moves until the owner approves it. The contract
decides which of those two happens. Not the agent, and not the prompt.

Every payment's memo carries the market and the odds that justified it, so the
reason is on-chain next to the money.

What makes it unique?

Per-payment caps are commodity. Circle, Coinbase, ACP and x402 all have them. The
part we could not find elsewhere is where the rolling daily total is enforced.

Across the agent payment protocols with public specifications as of November 2026,
a cumulative multi-payment budget is either declared out of scope, defined as a
constraint with no specified holder of the running total, or enforced inside a
provider's own backend. Stableplan keeps it in the contract, so the check and the
transfer are the same transaction and anyone can re-derive both from chain state.
`npm run attest` does that: it reads the day's agent spend back out of the event
log, sums it, and asserts it matches the contract's own counter and stays under
the cap. You do not have to trust our dashboard.

One more thing we did not expect to find. AP2 has no revocation primitive. A
case-insensitive search for revok|revoc across its specification and its agent
authorization docs returns nothing. Its only mitigation is short mandate
lifetimes, so a 24 hour mandate is 24 hours of authority you cannot stop. Ours is
one transaction: authorizeAgent(address(0)), and it takes effect for every token
at once.

The same primitive covers three relationship shapes, and all three are on chain
on Arc testnet right now: business to business (the venue's supplier deposit,
over the cap, owner approved), business to person (four shift contractors, inside
the caps, no human in the loop), and person to person (npm run p2p, the sender's
own balance, which is why it consumes none of the agent's budget).

What would you build next?

Fit the uplift coefficients to a venue's own POS history instead of owner-set
priors. Right now they are hand-tuned and that is the weakest joint in the
project.

Then the generalization we actually believe in. Supplier payments are a measured
$28B and B2B settlement $137B to $153B from January to August 2026 (Allium), and
B2B has the highest cross-border share of any segment at 43 percent. We are not
claiming the bar market. We are claiming the deposit, and a cross-border supplier
deposit is the same transaction with a longer settlement path on the other side.

Technologies and sponsor tools

Solidity and Foundry. Arc testnet, chain 5042002, where gas is USDC. Gemini
prediction markets API. QuickNode Streams. TypeScript with viem. Next.js 16 and
Tailwind. macOS Keychain and a Foundry keystore for keys. Vercel.
```

---

## 6. Demo Video (required)

```
https://drive.google.com/file/d/12QCEHVK5jW8AW2GkuNanJrUdC6DIPC1X/view
```

2 minutes 31 seconds, 1080p, shared to anyone with the link. Thirteen captioned shots
of the live product and real terminal output, in this order:

1. What it is, and where the caps live.
2. The problem: money committed before the night is known.
3. The forecast: 341 covers against 230 on a normal Friday.
4. The two Gemini markets behind that number, volumes included.
5. The plan, split into what the agent may pay and what it may not.
6. The budget meter at $100 of $150, with @sam and @lee flipped to approval mid-plan.
7. The owner's inbox.
8. The $92 supplier deposit approved live, in block 73211464, and the history row that
   says an owner approval is outside the agent's budget.
9. The same transaction on the Arc explorer.
10. `npm run attest`, ending on PASS, with the just-approved $92 correctly absent.
11. `script/refusals.sh`: four eth_calls the contract refuses.
12. The three relationship shapes, each with its transaction.
13. Links.

Every pixel of app and terminal content in it is a real capture or real stdout. The
captions are the only written part. No voiceover.

---

## 7. Github Repo Link (required, public repo required)

```
https://github.com/SGDlab67/stablegram-arc
```

Public.

---

## 8. Technical Summary (required)

```
Contracts (Solidity, Foundry, Arc testnet chain 5042002)

UsernameRegistry resolves a username to an address, one per address, first come
first served, case-insensitive. An unclaimed name reverts, so the agent cannot
pay an address nobody has claimed.

Stableplan holds the authorization. One agent per user, a per-send and a per-day
cap per token, both starting at zero. The daily counter is a packed struct, day
plus amount, and the day is block.timestamp / 1 days. A send that would push the
day's total over perDay reverts with OverDailyLimit before anything transfers,
because the check and the transfer are the same function. authorizeAgent(0)
revokes for every token in one transaction.

Proposals are the escalation path: the agent calls propose for anything it cannot
send itself, and only the user the proposal is for can approve it. approve() moves
the user's own money and deliberately does not touch spentOf, since the agent's
cap bounds the agent and not the account owner.

The contract holds no balance and has no owner. It moves value in the same
transaction it receives the instruction, so there is nothing in it to drain. A
fuzz test asserts that across the UTC day boundary: 41 Foundry tests, four of them
fuzzed at 256 runs, including an explicit 23:59:59 to 00:00:01 case.

Agent (TypeScript, viem, 25 tests)

Reads the Gemini markets, runs a deterministic forecast and plan, reads limitOf
and remainingToday on chain, then routes each payment to sendAsAgent or propose
on the same rule the dashboard displays. Every transaction is simulated before it
is sent. Keys live in the macOS Keychain and a Foundry keystore, never in files
or argv.

npm run attest is the auditable part. It scans the contract's Sent logs for the
current UTC day in the 5000-block chunks this RPC accepts, sums the owner's
agent-moved USDC, and asserts the total equals spentOf, that every send is inside
perSend, that the total is inside perDay, and that perDay minus the total equals
remainingToday. It also drops any Sent that shares a transaction with an Approved,
because an owner approval emits Sent(byAgent: true) while leaving spentOf alone.

QuickNode Streams

One Stream on Arc testnet filtered to the contract's four payment events, pushed
to the agent's webhook, HMAC verified. Arc produces a block roughly every 0.5s so
the batch arrives nested three deep. The feed also backfills from the chain at
boot, so the dashboard opens on the real history instead of whatever arrived
since the process started.

App (Next.js 16)

Owner dashboard: tonight's markets with odds, the forecast factor by factor, the
plan with each row labelled by relationship shape and whether the agent can pay
it, the agent's remaining budget for the day, the approvals inbox, and the
transaction history with times and explorer links.

What is real and what is not

Real: the contracts, every payment and proposal, the caps and the revocation, the
Gemini odds, the Stream, the attestation, and all three relationship shapes.

Not real: the consumer phone app at / is a prototype on local state. Its wallet
module connects to MetaMask or Phantom but does not sign, and its personas have
no usernames on chain. Person to person is proven through npm run p2p against the
deployed contract, not through that screen.

Also honest about: Gemini market liquidity is thin. Austin's high-temperature
market traded $323 in 24 hours on 2026-11-17, so we treat the prices as a
forecast signal and say so rather than pretending it is a deep market. And the
uplift coefficients are owner-set priors, not fitted to any venue's history.
```

---

## 9. Smart Contract / Program Address(es) (optional)

```
Arc testnet (chain 5042002), deployed from block 72747168
Explorer: https://explorer.testnet.arc.io

Stableplan        0x32d3b9d88168a5f2677a6513cfaa6ab0000920fa
UsernameRegistry  0xf1b6362d7849a9a7324739677adf0ab9dfd7f89f
MockShare         0xefbbc534bcd31c4e221cfd882a000b90beda23a7

USDC (native, and its ERC-20 interface) 0x3600000000000000000000000000000000000000
```

---

## State at submission

- [x] Demo video recorded, uploaded and link-shared (field 6)
- [x] Repo public (field 7)
- [ ] Charles's affiliation added to field 1, which needs an edit on Devpost
- [x] README carries the architecture overview, the repo layout and the run commands
- [x] 41 Foundry tests and 25 agent tests green on the submitted commit

Chain state as submitted: per-send cap $30, daily cap $150, $100 of it spent by the
agent today across four shift bonuses, one $92 supplier deposit approved by the owner
during the recording, and one $111 proposal left open for the live demo.
