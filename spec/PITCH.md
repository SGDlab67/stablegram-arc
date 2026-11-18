# Stableplan: what to say on stage

UBC Hackathon 2026, track: Agentic Payments and AI. Chain award: Arc.

Evidence behind every number here is in
`reports/Agentic payments business models.md` (gitignored, local only).
If a number is not in this file, do not say it.

## The claim

Say this, close to verbatim. It concedes what is commodity and stakes the
claim only on where enforcement lives, which is the part that holds up.

> Across the agent payment protocols with public specifications as of
> November 2026, a cumulative multi-payment budget is either declared out
> of scope, defined as a constraint with no specified holder of the running
> total, or enforced inside a provider's own backend. Stableplan enforces
> the rolling-day total in the settlement contract itself, so the check and
> the transfer are the same transaction, and anyone can re-derive both from
> chain state.

Per-payment caps are commodity. Circle, Coinbase, ACP and x402 all have
them. The locus is the claim, not the feature.

Second claim, cleaner than the first: **AP2 has no revocation primitive.**
A case-insensitive search for `revok|revoc` across its specification and
agent authorization docs returns nothing. Its only mitigation is short
mandate lifetimes, so a 24 hour mandate is 24 hours of unstoppable
authority. Ours is one transaction: `authorizeAgent(address(0))`.

## Beat order

Lead with the deposit. It is the leg with measured volume behind it, and
it is naturally over any sane cap, so the escalation is the normal case
rather than a staged demo moment.

1. **The problem.** A venue commits money before it knows what it needs.
   The food order and the supplier deposit both go in days early.
2. **The signal.** Gemini prediction markets price tonight's games and the
   city high temperature, live, every day. Nothing in the venue's stack
   reads them.
3. **The deposit.** The agent proposes it, the owner approves it, the chain
   records it. Over the per-send cap by design.
4. **The small payments.** Shift contractors paid by `@username`, inside
   the caps, no human in the loop, memo carries the odds that justified it.
5. **The four failures** (below). This is the product.
6. **Where it generalizes.** Supplier payments are a measured 28 billion
   USD and B2B settlement 137 to 153 billion USD, January to August 2026
   (Allium). B2B has the highest cross-border share at 43 percent. We are
   not claiming the venue market. We are claiming the deposit.

## The four failures

The demo is not the payments. It is the refusals. Show all four:

1. Agent attempts over the per-send cap, becomes a proposal.
2. Agent tries to approve its own proposal, contract rejects it
   (`NotYourProposal`).
3. Owner revokes mid-demo with `authorizeAgent(address(0))`.
4. Next agent payment reverts.

## Why this matters, said correctly

Use a published failure trace, not a market forecast.

- arXiv 2510.11977 logged tau-bench runs where an agent **completed a
  transaction exceeding the user's stated budget**, and another paying with
  the wrong payment method.
- Repeated success is the relevant metric for standing authority, not
  single-attempt success: original tau-bench **pass^8 was below 25 percent
  in retail**.

Say "benchmark traces, not production incidents." There is no production
incident rate for agent financial transactions, and someone who knows the
literature will say so if you do not.

## Market size, said honestly

Do not oversell this. The honest version is stronger.

- Measured agent payment value was **3.7 million USD in Q3 2026** (Allium),
  against 482 billion USD of stablecoin payments over nine months.
- x402 lifetime settled value is about **42 million USD across roughly 196
  million transactions**, so about 21 cents each. Monthly settled value
  fell from 20.5 million USD in November 2025 to **274,000 USD in October
  2026**.
- Artemis classifies **over 95 percent of x402 activity as protocol
  signaling** rather than buyer-seller exchange. Median wallet age at first
  payment fell to **18 minutes**.

The line: the market does not exist yet, and the trust primitive is the
reason. We built the primitive, not the market.

## Business model, if asked

Not a take rate. Wise's business cross-border take rate is **0.39 percent
and guided down 1 to 2 bps per quarter**, so charging 50 bps to authorize
money you never touch asks more than Wise charges to move it. Coinbase's
x402 facilitator is 0.001 USD per settlement. Settlement is priced at zero.
Authorization is the unpriced space.

The buyer who pays for this artifact is an insurer. AIUC ties coverage to
audit results and **lowers premiums as safety posture improves**. Armilla
is a Lloyd's coverholder pricing from a technical review of each system.
Munich Re's aiSure requires technical due diligence before coverage. A
non-repudiable record that the agent could not have exceeded its limit is a
priced input in someone else's risk model. **None of the three publishes
premiums, so quote no number.**

Volunteer the ceiling rather than get caught by it: every US spend-controls
company of scale was acquired by whoever owned the flow. Divvy to Bill.com
at roughly 2.5 billion USD with a card program attached, Airbase to
Paylocity at a 325 million USD headline being controls-heavy and
flow-light, Teampay and Center undisclosed. Controls-only is a feature of a
settlement business realized as an acquisition premium.

## Do not say

| Do not say | Why |
| --- | --- |
| "Cross-border payments cost 6.36 percent" | That World Bank figure is for sending 200 USD. At a 3,000 USD ticket a 25 USD wire is 83 bps, so it overstates the pain roughly 8x |
| "Agents fail 40 to 47 percent of the time" | Those tau-squared-bench figures are the **user simulator's** error rate, not the agent's |
| "x402 has done 50 billion USD" | A Solana page says 50B; every tracker supports 50M. Unit error |
| "15 trillion USD agentic market by 2028" | Gartner's figure is B2B procurement **intermediated by** agents, not revenue |
| "200 million agent payments proves demand" | A count on about 42 million USD of value, over 95 percent of it protocol signaling |
| "Non-custodial means no money transmitter exposure" | A section 1960 conviction stands against a developer who held no customer funds, and the criminal safe harbour was stripped from CLARITY before cloture failed 49 to 50 |
| "Circle's caps are off-chain" | Circle never states where policy executes and its smart contract accounts are paymaster-funded. Say instead that Circle does not claim third-party verifiability and applies policies on mainnet only |
| "We take 50 bps of authorized flow" | See Wise, above |

## Judge questions

**"Doesn't Circle already do daily and monthly caps?"**
Yes, and that is the point. Circle's caps are enforced by Circle, apply on
mainnet only, and are changed by an OTP the human runs in their own
terminal. The cap is as trustworthy as Circle. Ours is re-derivable from
chain state by anyone, including on testnet.

**"AP2 has a budget constraint, so what is new?"**
AP2 binds the constraint cryptographically and then obliges named verifiers
to evaluate it. It never says who keeps the running total across
occurrences, so a cumulative cap in AP2 requires an off-spec stateful
authority. The contract is that authority, with no trust assumption.

**"Is this money transmission?"**
The test is control over customer value, not the non-custodial label. The
contract never holds funds, pulls from the owner's balance in the same
transaction, and a fuzz test asserts its balance is always zero, so it is
designed to fail the control test. We acknowledge section 1960 exposure is
unresolved and the legislative fix stalled in September. If pressed: Storm
and Samourai are mixer fact patterns and a payment contract with named
counterparties and no anonymizing function is distinguishable on facts.
Say that as an argument, not a holding.

**"What is the market today?"**
Honestly tiny. 3.7 million USD of measured agent payment value in Q3 2026,
and no independently verified case of an enterprise granting an agent
autonomous spending authority in production. The argument is reliability,
not market size.

**"Who pays for this, given controls companies all get acquired?"**
Historically the rail owner buys the control layer. The buyer who would pay
for this artifact is the insurer, because all three AI insurers require a
technical audit before writing coverage and one of them discounts premiums
as safety improves.

**"Why Arc?"**
Gas is USDC, so a contractor who has never held crypto can receive a
payment and spend it without buying a gas token first. Sub-second
deterministic finality, so a payment is done on one receipt. And Circle's
own agent wallet policies reject testnet chains, so they apply on mainnet
only, while ours is identical on testnet and mainnet because it is in the
contract.
