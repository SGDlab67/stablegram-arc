# spec/ — the app and payment-layer proposal

**Status: a proposal on a branch. Nothing here is merged, and nothing in it has been compiled or run.** Written on Charlie's side on Nov 13 2026, before seeing the contracts already in this repo. This note says how the two fit together.

The folder is called `spec/` because this repo's `.gitignore` ignores `docs/`.

| File | What it is |
|---|---|
| `UI-SPEC.md` | The app, screen by screen, following Venmo's current layout |
| `SPEC.md` | Chain, server and data for the app, including a dollar-priced payment that converts to the asset the receiver picked |
| `SEED-DATA.md` | Arc and Monad facts, asset list, competitor check, pitch lines |

## How the spec maps to the contracts in `src/`

| In this repo | The spec calls it | Difference |
|---|---|---|
| `UsernameRegistry` | `Handles` | Same job. The spec adds `claimFor` (so a server can pay for sign-up and the user sends no transaction), a stored "Get paid in" preference, and a reserved-name list. The repo resolves names case-insensitively; the spec allows lower case only. |
| `Stablegram.sendToken` | `PayRouter.send` | Same job: an exact token amount to a username. |
| `Stablegram.sendNative` | not in the spec | The spec uses only USDC's ERC-20 interface on Arc. |
| Agent with per-send and per-day caps | not in the spec | Keep it. It is the "text your agent" feature and the spec has nothing like it. |
| `GatedShare` and `EligibilityRegistry` | not in the spec | Keep them. A reviewer's hardest question was "how do you stop a stock token reaching someone who may not hold it?" This is the answer. |
| not in the repo | `DemoVenue` | Prices assets and converts between dollars and demo assets. Needed for "I pay in Solana, you receive Nvidia". |
| not in the repo | `PayRouter.pay` | A payment priced in dollars that delivers the receiver's chosen asset. This is the app's main button. |
| not in the repo | `Onboarder` and a relayer | Sign-up with no wallet popup, plus a starter balance. |
| `Sent` event, note always on-chain | `Paid` event, note in the database | The spec keeps notes off-chain unless the payment is public, so a private payment's note is not readable on the chain forever. It links the two with a random `ref`. |

## Suggested way to combine them
Keep the contracts in `src/` as the base. Add to them, in this order:
1. A venue and a dollar-priced `pay` with the receiver's preference (in `Stablegram` or beside it).
2. `claimFor` and the "Get paid in" preference on the username registry.
3. The onboarder.
4. Make the on-chain memo optional and add a `ref`, so the app can offer private notes.

Until that is agreed, `SPEC.md` section 5 and Appendix A describe contracts that do not exist here, and the app should not be built against them.

## Things noticed in the repo
- CI is red on all three commits, at the formatting step (`forge fmt --check`, a diff in `src/GatedShare.sol`). The build and test steps come after it, so CI has not run them yet.
- The README says the hackathon runs Nov 13 to 20. UBC's build window opened Nov 12.
- The README plans a Monad deploy at the Blitz. Whether code written before Sunday may be used there is still an open question for the organisers.
- The repo is private. UBC needs it public by submission.
