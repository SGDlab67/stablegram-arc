# Settle — Build Spec v3.2 (send friends a slice of your portfolio)
UBC 2026 Hackathon on Arc (build now, submit Fri Nov 20, 10:00 AM PT) and Monad Blitz Oregon (Sun Nov 15).
Authors: Charlie Sneed, Huu Tai Le (Taihl). v3.1 written Fri Nov 13 2026 after an implementer review and a judge red-team (both in `reviews/`). **v3.2, Sat Nov 14: no conversion.** The receiver gets exactly the asset the sender sent and can sell it for dollars any time; "Get paid in" is gone. v3.1 is in `reviews/v3.1/`.

Nothing here has been compiled or run. Arc values were read from Arc's docs and its testnet RPC. One reviewer simulated the Memo design on Arc testnet with a read-only call; no transaction of ours has been mined on either chain. The spec is prose and tables with no source code.

`UI-SPEC.md` describes everything a user sees. This file describes the chain, the server and the data.

---

## 0. Instructions to the coding agent

Read this file, `SEED-DATA.md` and `UI-SPEC.md` in full before writing anything.

1. **Do not ask product questions.** Every decision is made here. If something is ambiguous, take the simpler reading, write one line in `NOTES.md`, and keep going.
2. **Build the milestones in section 2 in order.** Each has an acceptance line you can check yourself. Do not start one until the previous one passes.
3. **Deployed beats local.** The app is on Vercel in the first 15 minutes. It is a phone app that installs from a link (see UI-SPEC section 2), not a website: no landing page and no desktop layout. Only pushes to `main` deploy.
4. **Simulate before you send.** Every write is simulated first, and a call that would revert is never sent.
5. **No external call may be able to break a page.** Every third-party fetch has a cache and a stored snapshot.
6. **No secrets in the repo.** `.env.example` lists names only. `ADMIN_PRIVATE_KEY` is for local scripts and is never set in Vercel.
7. **Keep the README current** (section 15). Contract addresses go in the moment they exist.
8. **The app's name is one constant,** `NEXT_PUBLIC_APP_NAME`.
9. **Data conventions between sessions:** every token or dollar amount in JSON is a string of base units (`"2000000"` is two dollars); addresses and refs are lower-case hex; a token is sent as its address and symbol.

---

## 1. Product

**One line:** pay or request by @username, priced in dollars, and send it as any asset you hold: dollars, a stock, bitcoin. The receiver gets exactly that asset, in their own wallet, and can keep it or sell it for dollars any time.

**The example that defines it:** "Send me ten bucks." "Sure." Charlie sends $10 of NVIDIA. Wes now holds $10 of NVIDIA. If Wes would rather have cash, he taps Sell. There is no conversion in the payment: what leaves one portfolio arrives in the other.

**What it copies from Venmo, on purpose:** the feed with notes and emoji, reactions and comments, friends, pay and request from one button, a dollar keypad, QR codes, usernames, profile photos, and a privacy setting per payment.

**What we do not claim.** A judge can check each of these in a minute:
- That paying a username is new. Phantom, Krak, the Base app and Venmo do it, and Phantom's lands in the receiver's own wallet.
- That sending stock to a friend is new. Some brokers let you gift shares. We have not checked who lets you pay a friend back in stock by username; do that before the pitch.
- That the demo stocks are real. They are test tokens with real prices, labelled "(demo)". Real tokenized stocks are not offered to US persons.
- That "private" hides a payment on-chain. It hides it from feeds. A username is linked to a public wallet, and the app says so at sign-up.

**What we say instead:** "Venmo moves cash. This moves your portfolio. Pay a friend back in a slice of NVIDIA, they keep it or sell it, and it all happens in a feed your friends can see."

**Words:** say "pay", "request", "portfolio". Do not say "exchange", "bank", "trade" or "deposit account".

---

## 2. Milestones

Arc first. Each milestone ends with tests run, a commit, a push, a deploy, and its acceptance line printed with pass or fail. Script payments on Arc are $0.10 and $0.05 (section 16).

| # | Deliverable | Acceptance (checkable by the agent) |
|---|---|---|
| M0 | App live on Vercel: theme, tab bar, empty pages | Production URL returns 200 |
| M1 | **Chain core.** Contracts in section 5 with tests, deployed to Arc testnet with development grants; `deployments.json`; assets listed and priced. Left for M4: the fuzz test, `topUp`, `sendToAddress`, the 8-decimal venue tests. | `forge test` green. The chain smoke (section 16) passes on Arc testnet. README has the addresses. |
| M2 | **Sign up with a browser-made wallet.** Sign in, choose a username and a first stock, receive the grant, see the portfolio list | A script signs up three wallets through the deployed API (reusing them on later runs); each has a handle on-chain, and `/api/holdings` returns their balances |
| M3 | **Pay.** Pick a person, dollar keypad, note, pay with any holding, receipt. Requests: create, list, pay. "My code" and pay links. | Script: A pays B $0.10 in a demo stock; B's balance of that stock rose by exactly `tokensForUsd(stock, 0.10)`. B requests $0.05 and A pays it in dollars; B's dollars rose by exactly 0.05. Both are in `/api/feed`. |
| M4 | **Social, and everything Saturday skipped.** Friends, both feeds, reactions, comments, profiles and photos, audience per payment. Connected wallets (MetaMask, Rabby, Coinbase Wallet extension, Phantom). Decline, cancel, remind, split. Asset page with Buy and Sell. Camera scanner. `ensureFreshPrices`. The tests left out of M1. | Script: a Private payment is absent from Everyone and present in the payer's activity; two accounts become friends and a Friends payment shows for one and not for a stranger; a reaction and a comment appear |
| M5 | **Arc-native.** Fee in cents on every receipt. Public notes through Arc's Memo contract. EURC, cirBTC and WETH as real holdings that can be sent. Selling a received EURC or cirBTC for dollars through Circle's Swap Kit. | Script: a receipt shows a fee under one cent; a Public note is in a mined `Memo` event; A sends B EURC, B sells it through Swap Kit and USDC arrives |
| M6 | **Streams,** kept small: one Stream on the router's `Paid` event, one webhook, the "you got paid" notification fired from it, a backfill, a README paragraph | A payment sent straight to the contract, with no call to our API, appears in the feed |
| M7 | **Monad and the room.** A second deployment on Monad testnet. `/join` quick sign-up. `/room` big screen. | The chain smoke passes on Monad testnet. An 80-wallet load check from one IP passes. |
| M8 | **No wallet, no seed phrase.** Sign in with email through Circle Wallets. Pay someone who has not signed up, by link. | A script-created email wallet completes M3's flow |
| M9 | **Bring money in.** USDC from another chain with Circle's Bridge or Unified Balance kit. | A testnet bridge transfer shows in the portfolio |
| M10 | README final, Devpost answers, video, deck | Section 15 complete |

**Never cut:** M1 to M4, and from M5 the fee display and the Memo notes.
**Cut order after that, from the top:** M9 → M6 → M8 → the Swap Kit part of M5. Email sign-in and one Circle tool in the money path are what the Consumer and Arc judges are told to look for; they go last.

Dates and who does what are in RUNBOOK.

---

## 3. Stack and layout

- **Contracts:** Solidity 0.8.28, Foundry, OpenZeppelin Contracts v5. Unit tests use a mock six-decimal dollar token and run on plain `forge`. **The Arc deploy uses Arc's Foundry fork** (`arc-forge`, `arc-cast`), because a standard EVM simulation cannot reproduce how USDC moves on Arc; install it before M1 (it has no Intel-Mac build). Plain `forge` does the Monad deploy. If the Arc deploy script fails in simulation at a USDC step, it deploys and grants roles only, and funding is done with `arc-cast send`. Whether plain `forge` would have worked is unverified.
- **Web:** Next.js App Router, TypeScript, Tailwind, shadcn/ui, viem, TanStack Query, lightweight-charts, a QR generator, a camera QR scanner (M4). wagmi is used only to discover and connect injected wallets (M4); its write hooks are not used.
- **Database:** Postgres (Neon through the Vercel integration) with Drizzle. The default Neon HTTP driver has no transactions, so nothing in this spec holds a lock across a network call; leases are single statements (section 6).
- **Sessions:** Sign-In with Ethereum, an encrypted cookie.
- **Layout:** `/contracts`, `/web`, `/spec` (this kit), `README.md`, `NOTES.md`.

---

## 4. Chains

| | Arc testnet (primary) | Monad testnet (M7) |
|---|---|---|
| Chain ID | 5042002 | 10143 |
| RPC | `https://rpc.testnet.arc.io` | `https://testnet-rpc.monad.xyz` |
| Explorer | `https://explorer.testnet.arc.io` | `https://testnet.monadscan.com` |
| Faucet | `https://faucet.circle.com` | `https://faucet.monad.xyz` |
| Gas token | USDC | MON |
| Gas price | 25 gwei read Nov 13; a transaction under 20 gwei is dropped with no receipt | base fee floor 100 gwei, **billed on the gas limit** |
| Finality | under one second, no reorgs | about one block |
| Dollar in the app | **native USDC**, used only through its ERC-20 interface `0x3600000000000000000000000000000000000000`, 6 decimals | `tUSD`, our test dollar, 6 decimals |
| Sending | send, then poll the receipt every 400 ms for up to 30 s. `eth_sendRawTransactionSync` and `eth_simulateV1` are not supported; simulate with `eth_call`. | `eth_sendRawTransactionSync` (unverified on a keyed endpoint) |
| Multicall3 `0xcA11…CA11` | present | present |

**One deployment serves one chain,** set by `NEXT_PUBLIC_DEFAULT_CHAIN` at build time. Monad is a second Vercel project from the same repo with its own database. No route takes a chain parameter. A chain config holds: id, RPC URLs, explorer, native symbol, dollar token, whether the dollar needs an approval, whether sync send exists, whether a gas grant is needed, the Memo and Multicall3From addresses or none, and the deployments.

**Arc rules:**
- **One USDC, two decimal conventions.** The native balance has 18 decimals; the ERC-20 interface has 6 and truncates. The app and contracts use the ERC-20 interface for every amount. The fee is the one exception: `gasUsed × effectiveGasPrice` from the receipt is USDC with 18 decimals. One helper, `feeUsd()`, does that and nothing else touches 18 decimals.
- The fee is paid from the same USDC the user holds. The app treats the spendable USDC as the balance minus 0.05, kept for fees.
- A transfer to or from a blocklisted address reverts, and a blocklisted sender gets no receipt. A transfer to the zero address reverts.
- Several blocks can share a timestamp. Order by block number and log index.
- Arc contracts we use (addresses in SEED-DATA §2): Memo, Multicall3From, EURC, cirBTC, WETH.

**Monad rules** (from the archived kit; unverified on our contracts):
- An account under 10 MON cannot send MON repeatedly. The relayer never sends value; the Onboarder holds a MON float and pays gas grants from it.
- Gas limits on phones are fixed constants: the worst `eth_estimateGas` seen in the smoke times 1.15.
- A room on one Wi-Fi shares an IP. Phones read the feed from our API and send through a keyed RPC endpoint.
- The fee is shown in MON ("Fee 0.03 MON").

---

## 5. Contracts

Names, arguments, errors and events are in Appendix A. Every contract with roles uses AccessControl, and "admin" means `DEFAULT_ADMIN_ROLE`. The external functions of the venue, the router and the Onboarder are `nonReentrant`. Amounts are `uint256`, handles are `string`, `ref` is `bytes32`, payment ids start at 1.

### 5.1 `Handles`
The username registry. One handle per address and one address per handle.
- A handle is 3 to 20 characters from `a–z`, `0–9` and `_`. The contract checks every byte.
- `claim(handle)` by the user. `claimFor(account, handle)` by `REGISTRAR`; it respects the reserved list.
- `release()` frees the caller's handle; a released handle cannot be claimed for 30 days. The app has no button for it.
- `reserve(handles[])` by admin.
- `isAvailable` is false for an invalid, reserved, taken or cooling-down handle.

### 5.2 `DemoAsset`
One ERC-20 per demo asset. Name, symbol and decimals are constructor arguments; every deployed asset uses 18. Only the venue mints and burns. `allowance(owner, spender)` returns the maximum when `trusted[spender]` is true and the stored value otherwise; `setTrusted(spender, bool)` is admin-only. The deploy script trusts the router and the venue on every DemoAsset after the router exists.

### 5.3 `DemoVenue`
The stand-in for a DEX. It prices every asset in dollars (so a payment can be typed in dollars) and lets a holder buy or sell demo assets against the dollar token. Payments never go through it.
- `listAsset(token, convertible, priceUsd6)` by admin. Demo assets are convertible. Arc's real tokens (EURC, cirBTC, WETH) are listed as priced only. **The dollar token is never listed** and is always exactly one dollar.
- `setPrices(tokens[], pricesUsd6[])` by `PRICE_SETTER`. A price is the dollar value of one whole token with 6 decimals, stored with the time it was set.
- `buy(token, dollarsIn, to)` pulls the dollar token from the caller and mints the asset to `to`. `sell(token, amount, to)` burns the asset from the caller and pays dollars to `to` from the reserve, or reverts `ReserveEmpty`.
- Formulas, with OpenZeppelin `Math.mulDiv`: `tokensForUsd = ceil(usd6 × 10^dec / price6)`; `quoteBuy = floor(dollars6 × 10^dec / price6)`; `quoteSell = floor(amount × price6 / 10^dec)`.
- A price older than `maxAge` (24 hours on testnet) makes `buy`, `sell`, `quoteBuy`, `quoteSell` and `tokensForUsd` revert `StalePrice`. `assetInfo` never reverts.
- Every demo asset in existence was bought with dollars at the price of the moment, sign-up grants included. A price rise can still leave the reserve short; admin can add to it, and the README says so.
- The router reads one venue function, `tokensForUsd`. The asset page uses `buy` and `sell`. A venue backed by a real DEX would offer the same three. That adapter is described in the README, not built.

### 5.4 `PayRouter`
The only contract a user calls to pay. Constructor: `handles`, `venue`, `dollar`. It moves tokens straight from sender to receiver and never converts.

**`pay(handle, usdAmount6, token, maxAmount, ref)`**
1. Resolve the handle. Revert on an unknown handle, a payment to yourself, a zero amount, or a `ref` that is zero or already used (`RefUsed`).
2. If `token` is the dollar token, `amount = usdAmount6` and no price is read. Otherwise `token` must be listed (`NotListed`) and `amount = venue.tokensForUsd(token, usdAmount6)`, which reverts on a stale price. Revert `MaxAmountExceeded` if `amount > maxAmount`.
3. `transferFrom(sender, recipient, amount)`. The recipient gets exactly `amount` of `token`.

**`send(handle, token, amount, ref)`** and **`sendToAddress(to, token, amount, ref)`** move an exact token amount. Their `usdAmount6` is the amount's value at the venue's price, or 0 when that price is stale; they never revert on a stale price. The app uses `pay`; `send` is for "send all of it" and for scripts.

Every path emits `Paid`, with `from`, `to` and `ref` indexed. The router never holds a balance: tests assert it is zero after every call.

**Cases the tests cover:** dollar; demo asset; a priced-only real token (EURC); stale price reverts `pay` but not `send`; `maxAmount`.

**Note on the repo.** Taihl's `Stablegram.sendToken` already sends an exact amount to a username with a note. `pay` is the same move, typed in dollars. Merge the two rather than keeping both.

Requests are not on-chain. A request lives in the database, and paying it is an ordinary `pay` whose `ref` the server links to the request. The payer chooses which asset to pay a request in.

### 5.5 `Onboarder`
Constructor: `admin`, `handles`, `venue`, `dollar`; it approves the venue for the dollar token at the maximum.
- `onboard(account, handle, firstAsset)` by `RELAYER`, once per account. In one transaction: claims the handle for the account; if `firstAsset` is the dollar token, transfers the dollar grant plus the asset grant in dollars; otherwise transfers the dollar grant and buys the asset grant of `firstAsset` from the venue for the account; on Monad, sends the gas grant from its own MON float.
- `HandleTaken` and the other Handles errors bubble up unchanged.
- `topUp(account)` by `RELAYER`: one more gas grant on Monad, once per account per hour (M4).
- `setAmounts(dollarGrant, assetGrantUsd, gasGrantWei)` by admin. Development deployments use 0.50 and 0.50; SEED-DATA §4 has the amounts for the final one.
- Admin can withdraw the floats.

### 5.6 `TestUSD` (Monad only)
ERC-20, 6 decimals, `MINTER` mints. The same `trusted` allowance as DemoAsset; the deploy script trusts the router and the venue.

### 5.7 Approvals
- Demo assets and the Monad test dollar never need one.
- **On Arc, a user approves USDC twice, in one transaction:** a call to Multicall3From (`aggregate3`, no failures allowed) containing `approve(router, max)` and `approve(venue, max)`. The router needs it to send USDC; the venue needs it for Buy on the asset page. A browser-made wallet sends it silently right after `onboard`. A connected wallet sees one "Turn on payments" step.
- EURC, cirBTC and WETH each need one approval of the router the first time they are sent, and of Swap Kit's contract the first time they are sold.

### 5.8 Deploy
One script per chain run, broadcasting with `ADMIN_PRIVATE_KEY`. Order: TestUSD (Monad only) → Handles → DemoVenue → one DemoAsset per row of SEED-DATA §1 → PayRouter → Onboarder. Then: role grants (Appendix A), `setTrusted` on every DemoAsset and on TestUSD, list and price every asset, list Arc's real tokens as priced only, reserve handles, `setAmounts`, fund the Onboarder and the reserve. **Before a redeploy, the script calls `withdrawReserve` and `withdrawToken` on the previous deployment** so testnet USDC is not stranded. It writes `web/src/config/deployments.json` and copies ABIs to `web/src/config/abi/`. Never use the default Anvil keys on Arc: the first test account is on Arc's blocklist test list.

### 5.9 Tests (minimum)
Handle rules byte by byte; uniqueness; reserved names; release and cooldown; `claimFor` only by the registrar. Venue: buy and sell rounding at 6 and 18 decimals, stale price, empty reserve. Router: the cases in 5.4 with exact balances for both parties and a zero router balance; `maxAmount`; unknown handle; self-payment; `RefUsed`; `send`. Onboarder: once only, handle taken, the dollar-token branch, float accounting. Trusted-spender allowance. Left for M4: 8-decimal venue tests, `sendToAddress`, `topUp`, and a fuzz test on `pay` asserting the recipient's gain equals the sender's loss of that token, exactly.

---

## 6. Accounts, sign-in and sending

### 6.1 Wallets
`useWallet()` returns `{ address, kind: "injected" | "local" | "email", walletClient, publicClient }`. `walletClient` is a viem wallet client: for a browser-made wallet, one built from the stored key with the chain's HTTP transport; for an injected wallet (M4), the one wagmi hands back. Every write is `publicClient.simulateContract`, then `walletClient.writeContract`.

1. **Start without a wallet** (M2). The app makes a key in the browser, inside an effect, and keeps it in localStorage. Settings has "Back up key" and "Reset" behind a confirm.
2. **Use my wallet** (M4). Injected wallets found by EIP-6963 only: MetaMask, Rabby, the Coinbase Wallet extension, Phantom. No WalletConnect and no smart-contract wallets, because Arc's Memo contract must be called by a plain account. Phantom supports Arc; its testnet needs Phantom's Testnet Mode switched on, and the connect screen says so. Phantom does not support Monad.
3. **Email** (M8). Circle user-controlled wallets configured as plain accounts.

### 6.2 Sign-in
`POST /api/auth/nonce` stores a nonce in the encrypted cookie. The client builds the message with viem's `createSiweMessage` (domain `window.location.host`, the page origin as URI, the chain id) and signs it. The server checks that the domain equals the request's `Host`, that the nonce equals the cookie's, that the message is under ten minutes old, and the signature with viem's pure `verifyMessage`, which makes no RPC call. The cookie then holds the lower-case address for seven days. Scripts sign the same message for the deployed host. `GET /api/auth/me` tells the client whether it is signed in and has a user row.

### 6.3 Sign-up
The screens are in UI-SPEC section 4. On the server, `POST /api/signup` runs in this order: validate the handle and the session; `ensureFreshPrices()`; `relayerSend(onboard)`; wait for the receipt; **then** insert the user row with the handle from the `Onboarded` event; return `{ ok, hash, needsApproval }`. If the address is already onboarded, read `handleOf`, write the row if it is missing, and return ok. The user row never exists before the chain agrees.

### 6.4 `relayerSend`
One helper sends every relayer transaction, one at a time per key.
1. Simulate the call. If it would revert, return the decoded error and send nothing.
2. Take a lease with one statement: update the `kv` row `relayer_lease:<key index>` to this request's id with an expiry 15 seconds ahead, where the stored expiry is in the past, returning the key. Retry every 150 ms for up to 20 s.
3. Read the nonce from the chain: `eth_getTransactionCount(relayer, 'pending')`. The nonce is never stored.
4. Sign, send, and wait up to 8 s for the receipt.
5. No receipt: re-send the same signed transaction once. Still none: write an `errors` row; the next send uses the `latest` count with fees 1.5 times higher, to replace it.
6. Release the lease.

`RELAYER_PRIVATE_KEYS` holds up to four keys, each with its own lease, and sign-ups rotate across them. Scripts use the same helper; with no `DATABASE_URL` they skip the lease. `/admin` shows each relayer's latest and pending counts.

**Limits on sign-up:** one per address; `SIGNUP_CAP_PER_IP` per hour (default 5; 0 turns it off; `/admin` can change it for a room); a global cap per hour; a pause when the Onboarder's float falls below `SIGNUP_FLOAT_FLOOR`. A request carrying the admin passcode header skips the IP and global limits, so scripts and the load check run.

### 6.5 Sending a payment
1. The app posts the draft: recipient, dollars, note, the payer's audience choice, a fresh random `ref`, and the request id if it is paying one. The server stores it and returns `{ ok, audience, firstTime }`, where `audience` is the effective one (section 10). A request can have one open draft at a time.
2. The app shows the confirm sheet: the holdings that cover the amount, and for the chosen one the token amount from `router.quote`, read from the chain. "Wes gets 0.0619 NVDA."
3. When the user taps Pay, the app reads the quote again, sets `maxAmount` to `amount` plus one percent, simulates `pay`, then sends. On `MaxAmountExceeded` the sheet shows "The price moved" with the new amount and waits for another tap.
4. The app saves `{ ref, hash }` in localStorage the moment it has the hash, posts it to confirm, and re-posts any unconfirmed ones on every load.
5. **Confirm.** The server fetches the receipt and finds the `Paid` log **by its emitter, the router's address**, not by the transaction's `to` (a Public payment on Arc is sent to the Memo contract). It requires a successful receipt and that `ref`, `from` (the session address), `to` and `usdAmount6` match the draft. No receipt yet returns `{ ok, status: "pending" }` and the app retries each second for 30 s, then shows "Still pending". A reverted receipt marks the draft failed. Confirm is idempotent.
6. Drafts are never deleted on a timer. Feeds ignore them. A read of a draft older than 30 s looks on-chain for a `Paid` log with that `ref` and confirms it if found. `/admin` can purge drafts older than a day.

**Errors.** One decoder merges every contract's ABI. On Arc it first unwraps `MemoFailed(bytes)` and decodes the inner bytes. The user sees one plain sentence (UI-SPEC section 13).

---

## 7. Pages outside UI-SPEC

**`/join`** (M7). The room's QR opens it. One screen: a suggested username already filled in and editable, and a row of tiles, "Pick your first stock". One tap on a tile makes a wallet, signs in, signs up, and lands on Home. Display name is the username; photo and the rest can be added later.

**`/room`** (M7). For a projector; it never needs to be left during a demo.
- Left: a large QR and how many have joined. An admin control swaps it between the join code and a pay-me code for one username.
- Centre: the live feed in large type. On each row **the asset chip is the largest text** ("dNVDA"). A payment by the presenter's username pins to the top for 20 seconds.
- Right: counters (people, payments, dollars moved, median confirmation time) and a chart of which assets the room is sending each other. No individual amounts.

**`/admin`.** Passcode, compared in constant time. Balances of each relayer and the Onboarder; the age of on-chain prices and a "Push prices" button; pause sign-ups; the per-IP and global caps; each relayer's latest and pending counts; last 20 server errors; purge old drafts; the `/room` QR control.

Footer on every page: "Testnet demo. Demo assets are test tokens that follow real prices. They are not shares or coins, and nothing here is advice."

---

## 8. Server routes

Success is `{ ok: true, … }`; failure is `{ ok: false, error: { code, message } }`. Tables and shapes are in Appendix B. Every write needs a session, and the session's address is the only identity the server trusts. Every route that returns a payment, its reactions or its comments applies `canSee` (section 10) and returns 404 otherwise.

| Route | Owner | Notes |
|---|---|---|
| `POST /api/auth/nonce`, `POST /api/auth/verify`, `POST /api/auth/logout`, `GET /api/auth/me` | B | Section 6.2 |
| `GET /api/handles/check?h=` | B | Rules, reserved list, on-chain `isAvailable` |
| `POST /api/signup` | A | Section 6.3 |
| `PATCH /api/me`, `POST /api/me/avatar`, `GET /api/avatar/[handle]` | B | Names, default audience, photo. |
| `GET /api/users/search?q=`, `GET /api/users/[handle]` | B | A recipient must have a user row |
| `GET /api/friends`, `POST /api/friends`, `POST /api/friends/accept`, `DELETE /api/friends` | B | Friends, incoming requests, suggestions |
| `POST /api/payments` (draft) | B | Section 6.5 step 1 |
| `POST /api/payments/[ref]/confirm` | A | Section 6.5 step 5 |
| `GET /api/payments/[ref]` | B | With comments and reactions; amounts only for the two people |
| `POST /api/payments/[ref]/react`, `POST /api/payments/[ref]/comments` | B | `react` toggles |
| `GET /api/feed?scope=friends\|everyone\|me&cursor=` | B | Section 10 |
| `POST /api/requests`, `GET /api/requests`, `POST /api/requests/[id]/decline`, `/cancel`, `/remind` | B | `POST` takes one person or several (a split) |
| `GET /api/notifications` | B | |
| `GET /api/holdings?address=`, `GET /api/portfolio/history?range=` | A | One multicall and `assetInfo`; never reverts on a stale price |
| `GET /api/prices`, `GET /api/assets/[symbol]/chart` | A | Section 11 |
| `GET /api/quote?token=&usd=&to=` | A | The router's `quote`; cached two seconds at the CDN |
| `GET /api/room` | A | Cached one second at the CDN |
| `POST /api/streams` | A | M6 |
| `POST /api/admin/{status,push-prices,pause-signups,set-caps,purge-drafts,room-qr}` | A | Passcode header |

Session A also owns `relayerSend`, `ensureFreshPrices`, the error decoder and every script. Session B owns the schema, the session helper, `useWallet` and the shared types, and commits those in its first 30 minutes because Session A's routes need them.

---

## 9. Indexing and Streams

Until M6 a payment enters the feed when the payer's app posts its hash and the server verifies the receipt. Statuses are `draft`, then `confirmed` or `failed`.

**M6.** One QuickNode Stream on the logs dataset, filtered to the router's address and the `Paid` topic, delivering to `/api/streams`. The webhook verifies the signature, upserts by payment id, fetches the receipt for the fee (the logs dataset has no gas fields), and **writes the "you got paid" notification**. From then on the Stream is what marks a payment confirmed; the app's own post makes it `pending` and shows it at once to the two people. A payment made straight to the contract, with no draft, appears with an empty note and the stricter of the two people's default audiences. A backfill from the deploy block rebuilds the payments table from nothing. The README documents the network, dataset, filter, destination and reason.

---

## 10. Social rules

- **Friends are mutual:** one person asks, the other accepts.
- **Audience:** Public, Friends, Private. **The effective audience is the stricter of the payer's choice and the recipient's default** (Private, then Friends, then Public). The payer's own default only pre-selects the control. The server computes it when the draft is posted and returns it. The app uses the returned value everywhere, including to choose between Memo and a direct call, and says "Private because @sam keeps payments private" when it changed. Paying a request also takes the request's audience into account.
- **`canSee(viewer, payment)`:** Public, anyone. Friends, either person, or an accepted friend of either. Private, the two people.
- **Feeds:** Everyone is confirmed Public payments. Friends is confirmed payments where the viewer is a friend of at least one of the two people and `canSee` is true. Me is every payment the viewer is in, plus their own pending ones. A signed-out visitor gets Everyone only.
- **Default audience for a new account: Public,** as Charlie asked. It is one constant, `DEFAULT_AUDIENCE`, so it can flip. Sign-up says: "Your username is linked to a public wallet. Anyone can see its balances and payments on the blockchain."
- **Amounts** show only to the two people, everywhere, including `/room`.
- **Reactions:** one per person per payment, from six emoji; anyone who can see the payment. **Comments:** 280 characters; the two people and their friends.
- **Notes:** 140 characters, required, stored in the database. On Arc a note is also written on-chain through Memo only when the effective audience is Public (section 12).
- No blocking, reporting or moderation in the hackathon build. The README lists them as missing.

---

## 11. Prices

- Ids and decimals are in SEED-DATA §1. `GET /api/prices` reads CoinGecko `/simple/price` for every id, cached 60 s in the database, with a snapshot in the repo as the last fallback.
- **`ensureFreshPrices()`** (M4; until then prices are pushed by the deploy script and the `/admin` button). It runs first in the quote, holdings, sign-up and draft routes. If the oldest on-chain price is over ten minutes old it takes a `price_lease`, built like the relayer lease, pushes with `setPrices` through `relayerSend`, and waits for the receipt. A request that finds the lease taken carries on with the current price, or waits up to 5 s if that price is past `maxAge`. If CoinGecko fails it pushes the last cached prices again so the timestamp is fresh. The relayer holds `PRICE_SETTER`.
- Quotes and portfolio values in the UI come from the on-chain price, so what the user sees is what the router charges.
- Stock prices come from the xStocks tokens, which trade all week. Charts: CoinGecko `market_chart`.

---

## 12. Arc features (M5)

1. **Fee in cents** on the confirm sheet and every receipt, from the receipt. The Me page totals the user's fees.
2. **Notes through Memo.** When the effective audience is Public, the app calls Arc's Memo contract with the router as the target, the `pay` call as the data, `ref` as the memo id, and exactly the UTF-8 bytes of the stored note as the memo. Arc runs the inner call with the user as the sender, so the router and the user's approval behave the same; a reviewer's simulation on Arc testnet confirmed that, and the first mined one is a deploy check. For Friends and Private the app calls the router directly. If `eth_getCode` of the user's address is not empty, it skips Memo.
3. **Real Arc assets.** EURC, cirBTC and WETH show in the portfolio when held and are paid with the same dollar keypad. They are priced only: paying with one delivers that same token.
4. **Sell for dollars, for real.** A received EURC or cirBTC has a "Sell for dollars" button that swaps it to USDC with Circle's Swap Kit (which works on Arc testnet for USDC, EURC and cirBTC). Demo assets sell through the venue. The Arc demo: "Taihl sent me ten dollars of euros. One tap, and it's dollars." This is the Circle tool in the money path.
5. **Later (M9):** USDC from other chains with the Bridge or Unified Balance kit.

---

## 13. Design
In UI-SPEC sections 1 to 3. Layout and flows follow Venmo's current app; the name, logo, colour and illustrations are ours.

---

## 14. Environment variables (names only)

`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DEFAULT_CHAIN`, `NEXT_PUBLIC_RPC` (a keyed endpoint with a domain allow-list set at the provider, because it is visible in the browser), `RPC_SERVER`, `RELAYER_PRIVATE_KEYS`, `ADMIN_PASSCODE`, `SESSION_SECRET`, `DATABASE_URL`, `DEFAULT_AUDIENCE`, `SIGNUP_CAP_PER_IP`, `SIGNUP_CAP_PER_HOUR`, `SIGNUP_FLOAT_FLOOR`, `COINGECKO_API_KEY` (optional); later `QUICKNODE_STREAMS_SECRET`, `CIRCLE_API_KEY`. Local scripts only: `ADMIN_PRIVATE_KEY`.

---

## 15. README (graded)

In this order: what it is, in three sentences; live URL; how to run; **contract addresses per chain with explorer links**; architecture with a diagram and a paragraph per contract; the payment path, step by step, for the $10-of-NVIDIA example; **how it uses Arc**, under the hackathon guide's own four headings (payments and FX with USDC as gas; Circle tools used; simple fees and balances; what comes next); what is real and what is mocked, as a table (wallets, transfers and prices real; demo assets and the venue mocked; selling EURC through Swap Kit real); the three venue functions and what an adapter for a real DEX needs; **risks and limits** (irreversible payments and wrong recipients; username impersonation and the reserved list; the relayer's powers over prices and sign-up; a username is linked to a public wallet, so balances and amounts are readable on-chain; tokenized stocks are freely transferable but may not be offered to US persons, and that duty would be ours; a spread on Buy and Sell could make the operator a money transmitter, so it is not switched on; sending an appreciated stock to a friend may be a gift or a sale for tax purposes; paying with an appreciated asset is a taxable sale in the US; no moderation); a role table; measured fees; Streams; Monad; data sources; what is next.

---

## 16. Testing

- **Foundry tests** as in 5.9.
- **Scripts keep their wallets** in a gitignored `scripts/.wallets.json` and reuse them; a wallet already onboarded is skipped. On Arc a script run should cost cents, not a faucet claim.
- **Chain smoke** (contracts only, both chains): three wallets are onboarded with handles; on Arc each sends the two-approval transaction; A pays B $0.10 in dollars; A pays B $0.10 in a demo stock; B pays C with `send`; B sells the stock at the venue. **Assertions:** recipients' changes are exact. For the sender of a dollar payment on Arc, `before − after` is at least the amount and at most the amount plus 0.01, because the fee leaves the same balance; compare 6-decimal `balanceOf` only. The router's token balances and its native balance are zero. Prints pass or fail, gas per call, and on Arc the fee in dollars.
- **API smoke:** the same through the deployed routes, with a request, a Private payment, a reaction and a comment.
- **Load check before a room (Monad):** the API smoke with 80 wallets from one IP, with the passcode header, at the venue.

---

## 17. Pitfalls

- Arc: only `feeUsd()` touches 18 decimals. cirBTC has 8. Every amount calculation takes decimals from the token.
- Arc: the first payment fails if the two-approval step was skipped. `/api/auth/me` reports whether the approvals exist.
- Arc: a Public payment's transaction goes to the Memo contract. Find `Paid` by emitter.
- The effective audience comes from the server. Never choose Memo from the payer's own selection.
- No database lock across a network call. Leases are single statements with an expiry.
- Never store a nonce. Read it from the chain inside the lease.
- A handle is lower case in the contract. Lower-case it in the app before every lookup.
- Read localStorage only inside an effect.
- The camera scanner needs HTTPS and a tap on iOS Safari. In-app browsers (Telegram, Instagram, X) often block the camera and hold a different localStorage: show "Open in Safari or Chrome".
- Monad bills the gas limit. Measure, then fix the limits.
- Vercel's free plan runs scheduled jobs once a day. Nothing here depends on a schedule.
- Sign-in checks the domain against the request's host, so preview URLs work.

---

## Appendix A. Contract interface

**Constructors:** `Handles(admin)` · `DemoVenue(admin, dollar)` · `DemoAsset(admin, name, symbol, decimals)` · `PayRouter(handles, venue, dollar)` · `Onboarder(admin, handles, venue, dollar)` · `TestUSD(admin)`

| Contract | Writes (role) | Views | Events | Errors |
|---|---|---|---|---|
| Handles | `claim(handle)`; `claimFor(account, handle)` (REGISTRAR); `release()`; `reserve(handles[])` (admin) | `addressOf(handle) → address`; `handleOf(account) → string`; `isAvailable(handle) → bool`; `isReserved(handle) → bool` | `HandleClaimed(account, handle)`; `HandleReleased(account, handle)`; `HandlesReserved(handles)` | `InvalidHandle`, `HandleTaken`, `HandleReserved`, `HandleCoolingDown`, `AlreadyHasHandle`, `NoHandle` |
| DemoAsset | `mint(to, amount)`, `burn(from, amount)` (VENUE); `setTrusted(spender, bool)` (admin) | ERC-20; `trusted(spender) → bool` | `TrustedSet(spender, trusted)` | |
| DemoVenue | `listAsset(token, convertible, priceUsd6)` (admin); `setPrices(tokens[], pricesUsd6[])` (PRICE_SETTER); `setMaxAge(seconds)` (admin); `buy(token, dollarsIn, to) → out`; `sell(token, amount, to) → dollarsOut`; `fundReserve(amount)`; `withdrawReserve(amount)` (admin) | `dollar()`; `assets() → address[]`; `assetInfo(token) → (listed, convertible, decimals, priceUsd6, updatedAt)`; `maxAge()`; `quoteBuy(token, dollarsIn)`; `quoteSell(token, amount)`; `tokensForUsd(token, usdAmount6)` | `AssetListed(token, convertible)`; `PricesSet(tokens, prices)`; `MaxAgeSet(seconds)`; `Bought(buyer, token, dollarsIn, out, to)`; `Sold(seller, token, amount, dollarsOut, to)`; `ReserveFunded(amount)`; `ReserveWithdrawn(amount)` | `NotListed`, `NotConvertible`, `StalePrice`, `ReserveEmpty`, `ZeroAmount`, `LengthMismatch` |
| PayRouter | `pay(handle, usdAmount6, token, maxAmount, ref) → paymentId`; `send(handle, token, amount, ref) → paymentId`; `sendToAddress(to, token, amount, ref) → paymentId` | `quote(handle, usdAmount6, token) → (to, amount)` (reverts on an unknown handle); `usedRef(ref) → bool`; `paymentCount()`; `handles()`; `venue()`; `dollar()` | `Paid(paymentId, from indexed, to indexed, ref indexed, usdAmount6, token, amount)` | `UnknownHandle`, `SelfPayment`, `ZeroAmount`, `MaxAmountExceeded`, `RefUsed`, `NotListed` |
| Onboarder | `onboard(account, handle, firstAsset)` (RELAYER); `topUp(account)` (RELAYER); `setAmounts(dollarGrant, assetGrantUsd, gasGrantWei)` (admin); `withdrawNative(amount)`, `withdrawToken(token, amount)` (admin); accepts native transfers | `onboarded(account) → bool`; `count()`; `dollarGrant()`; `assetGrantUsd()`; `gasGrantWei()`; `lastTopUp(account)` | `Onboarded(account, handle, firstAsset)`; `ToppedUp(account, amount)`; `AmountsSet(dollarGrant, assetGrantUsd, gasGrantWei)` | `AlreadyOnboarded`, `FloatEmpty`, `TopUpTooSoon` |
| TestUSD (Monad) | `mint(to, amount)` (MINTER); `setTrusted(spender, bool)` (admin) | ERC-20, 6 decimals; `trusted(spender)` | `TrustedSet(spender, trusted)` | |

**Role grants and funding in the deploy script**

| Grant or funding | On | To |
|---|---|---|
| `REGISTRAR` | Handles | Onboarder |
| `VENUE` | each DemoAsset | DemoVenue |
| `PRICE_SETTER` | DemoVenue | every relayer address, and admin |
| `RELAYER` | Onboarder | every relayer address |
| `MINTER` | TestUSD (Monad) | admin |
| trusted spender | each DemoAsset, and TestUSD | PayRouter and DemoVenue |
| dollar float | — | Onboarder |
| dollar reserve | — | DemoVenue, a small buffer for price rises |
| MON float (Monad) | — | Onboarder |

## Appendix B. Database and shapes

**Tables**
- `users`: address (key), handle (unique), first_name, last_name, avatar (256 px JPEG bytes, nullable), default_audience, created_at
- `payments`: id (serial key), ref (unique), payment_id (unique, null until confirmed), tx_hash, block_number, log_index, from_address, to_address, usd_amount, token, amount, note, audience, status (`draft` | `pending` | `confirmed` | `failed`), request_id, fee_native, fee_usd, confirm_ms, created_at, confirmed_at
- `requests`: id, split_id, requester, payer, usd_amount, note, audience, status (`open` | `paid` | `declined` | `cancelled`), payment_ref, reminded_at, created_at
- `reactions`: payment_id, address, emoji, created_at; key (payment_id, address)
- `comments`: id, payment_id, address, text, created_at
- `friendships`: user_a, user_b, requested_by, status (`pending` | `accepted`), created_at; key (user_a, user_b) with user_a < user_b
- `notifications`: id, address, kind (`friend_request` | `friend_accepted` | `money_request` | `paid` | `reaction` | `comment`), actor, payment_id, request_id, read, created_at
- `signup_attempts`: ip, created_at
- `kv`: key, value, expires_at (leases, price cache, caps)
- `errors`: id, route, message, created_at

**Shapes**
- Person: `handle`, `firstName`, `lastInitial`, `hasAvatar`
- Feed item: `ref`, `from` and `to` (Person), `note`, `audience`, `token` (`address`, `symbol`), `createdAt`, `status`, `txHash`, `reactions[]` (`emoji`, `count`, `mine`), `commentCount`, `requestId`, and for the two people only: `usdAmount`, `amount`, `feeUsd`
- `GET /api/feed` → `{ ok, items[], nextCursor }`
- `GET /api/auth/me` → `{ ok, signedIn, address, user | null, needsApproval, openRequests, unread }`
- `POST /api/signup` body `{ handle, firstName, lastName, firstAsset, defaultAudience }` → `{ ok, hash, needsApproval }`
- `POST /api/payments` body `{ ref, toHandle, usdAmount, note, audience, requestId? }` → `{ ok, audience, firstTime }`
- `POST /api/payments/[ref]/confirm` body `{ hash, confirmMs }` → `{ ok, status, feeUsd }`; `confirmMs` is the time the app measured from sending to the receipt, shown as the median on `/room`
- `GET /api/payments/[ref]` → `{ ok, item, comments[] }`, each comment `id`, `person`, `text`, `createdAt`
- `GET /api/quote` → `{ ok, to, amount, priceAgeSeconds }`
- `GET /api/holdings` → `{ ok, totalUsd, change24hUsd, assets[] }`, each asset also has `fromFriendsUsd`,, each asset `symbol`, `name`, `address`, `decimals`, `amount`, `usd`, `priceUsd`, `change24h`, `demo`, `group` (`stocks` | `crypto` | `cash`)
- `GET /api/users/[handle]` → `{ ok, person, friendship: "none" | "requested" | "incoming" | "friends", mutualFriends, payments[] }`
- `GET /api/friends` → `{ ok, friends[], incoming[], suggested[] }`
- `POST /api/requests` body `{ people: [{ handle, usdAmount }], note, audience }` → `{ ok, ids[], splitId }`
- `GET /api/requests` → `{ ok, incoming[], outgoing[] }`
- `GET /api/room` → `{ ok, joined, items[], pinned | null, counters { people, payments, usdMoved, medianConfirmMs }, assetMix[], qr { mode, handle | null } }`

Explorer links are `{explorer}/tx/{hash}` and `{explorer}/address/{address}` on both chains.
