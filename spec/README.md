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
| `UsernameRegistry` | `Handles` | Same job. The spec adds `claimFor` (so a server can pay for sign-up and the user sends no transaction) and a reserved-name list. The repo resolves names case-insensitively; the spec allows lower case only. |
| `Osmo.sendToken` | `PayRouter.send` | Same job: an exact token amount to a username. |
| `Osmo.sendNative` | not in the spec | The spec uses only USDC's ERC-20 interface on Arc. |
| Agent with per-send and per-day caps | not in the spec | Keep it. It is the "text your agent" feature and the spec has nothing like it. |
| `GatedShare` and `EligibilityRegistry` | not in the spec | Keep them. A reviewer's hardest question was "how do you stop a stock token reaching someone who may not hold it?" This is the answer. |
| not in the repo | `DemoVenue` | Prices assets in dollars and lets people Buy and Sell demo assets. Payments do not go through it. |
| `Osmo.sendToken` | `PayRouter.pay` | Since spec v3.2 there is no conversion: `pay` is `sendToken` typed in dollars (the venue's price turns $10 into a token amount). Extend `sendToken` rather than adding a router. |
| not in the repo | `Onboarder` and a relayer | Sign-up with no wallet popup, plus a starter balance. |
| `Sent` event, note always on-chain | `Paid` event, note in the database | The spec keeps notes off-chain unless the payment is public, so a private payment's note is not readable on the chain forever. It links the two with a random `ref`. |

## Suggested way to combine them
Keep the contracts in `src/` as the base. Add to them, in this order:
1. A venue for prices, Buy and Sell, and a dollar-priced `pay` next to `sendToken` (no conversion; the receiver gets what was sent).
2. `claimFor` on the username registry, so sign-up costs the user nothing.
3. The onboarder.
4. Make the on-chain memo optional and add a `ref`, so the app can offer private notes.

Until that is agreed, `SPEC.md` section 5 and Appendix A describe contracts that do not exist here, and the app should not be built against them.

## Things noticed in the repo
- CI is red on all three commits, at the formatting step (`forge fmt --check`, a diff in `src/GatedShare.sol`). The build and test steps come after it, so CI has not run them yet.
- The README says the hackathon runs Nov 13 to 20. UBC's build window opened Nov 12.
- The README plans a Monad deploy at the Blitz. Whether code written before Sunday may be used there is still an open question for the organisers.
- The repo is private. UBC needs it public by submission.

## Wallet sign-in: where to plug in (for Taihl)
Everything wallet-related in the app goes through `web/src/lib/wallet.ts` → `connectWallet(kind)`, which returns `{ kind, address, demo }`.

| Kind | What it does now | What it should do |
|---|---|---|
| `phantom`, `metamask` | Calls `eth_requestAccounts` on the injected wallet. On a phone without one, opens the app's deep link. | Same, then switch to Arc testnet 5042002, sign a Sign-In with Ethereum message, register `username → address`. |
| `created` | Makes a random demo address. | Embedded wallet (Circle user-controlled wallets, Privy, or a passkey wallet), with backup later. |
| `other` | Demo address. | WalletConnect / Reown AppKit. |

Sign-up then calls `signUp({ handle, first, last, photo, country, address })` in `web/src/lib/store.tsx`; that is where the registry call goes.

## Face ID sign-in and recovery phrase (for Taihl)
- `web/src/lib/passkey.ts`: `createPasskey(username)` and `signInWithPasskey()` already call WebAuthn on https/localhost (real Face ID / Touch ID prompt) and fall back to an animation. Next: make the passkey the wallet's signer (Circle Modular Wallets, passkey-owned smart accounts; check Arc testnet support) and map credential id → account.
- `web/src/lib/recovery.ts`: demo words only. Swap in viem `generateMnemonic(english)`, `mnemonicToAccount`, `validateMnemonic`. The phrase never leaves the phone.

## Update, 2026-11-15 (Taihl)
Corrections to the notes above, which were written before the current contracts were visible on this branch.

- **The gate and the wrapper are gone.** `GatedShare` and `EligibilityRegistry` were dropped on purpose: anyone can hold the share in this concept, and Osmo sends the token you already hold. Ignore the "Keep them" row in the table.
- **Three contracts exist:** `MockShare`, `UsernameRegistry`, `Osmo`. They are live on Arc testnet (chain 5042002).
- **Build the app against `deployments/arc-testnet.json`.** It holds the addresses and the ABIs. Nothing else in the repo is needed to call the contracts.
- **Not built:** `DemoVenue`, `claimFor`, the `Onboarder` and relayer, and the off-chain note with a `ref`. The note is always on-chain in the `Sent` event today.
- **CI is green**, and it now lints and builds `web/` as well as running the Foundry checks.
- **A working reference client is in `demo/index.html`:** one file, no build, real sends on Arc testnet. Copy the calls from there when wiring `connectWallet()` and `signUp()`.
